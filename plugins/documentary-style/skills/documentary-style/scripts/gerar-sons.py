#!/usr/bin/env python3
"""DocumentaryStyle: gera a TRILHA de cada tema e os EFEITOS sonoros (tudo sintetizado, sem direito autoral).

uso:  python gerar-sons.py <projeto>/public/doc/sons            (precisa de numpy e scipy; ffmpeg é opcional)
      python gerar-sons.py <saida> --so guerra,investigacao     (só algumas trilhas)

Saída:
  trilhas/<tema>-serio.mp3  e  trilhas/<tema>-dinamico.mp3   (64 s, emendam em loop; .wav se não houver ffmpeg)
  efeitos/serio/*.wav       e  efeitos/dinamico/*.wav         (sopro, ping, tique, tecla, carimbo, clique, impacto, pop)

Tudo sai normalizado com pico em -1 dBFS. O VOLUME final (sempre abaixo da locução) é decidido pelo DocVideo.
Para usar a música do canal no lugar da sintetizada: `som: { trilha: { src: 'musicas/minha.mp3' } }` no plano.
"""
import os
import shutil
import subprocess
import sys
import wave

import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
DUR = 64.0
rng = np.random.default_rng(1945)


# ---------- utilidades ----------
def t_(d):
    return np.arange(int(d * SR)) / SR


def lp(x, f, o=2):
    return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)


def hp(x, f, o=2):
    return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)


def bp(x, a, b, o=2):
    return sosfilt(butter(o, [a, b], 'band', fs=SR, output='sos'), x)


def nf(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def env(n, a=0.005, d=0.3):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)


def ruido(d):
    return rng.standard_normal(int(d * SR))


def por(buf, x, at, g=1.0):
    i = int(at * SR) % len(buf)
    fim = min(len(buf), i + len(x))
    buf[i:fim] += x[: fim - i] * g
    resto = len(x) - (fim - i)
    if resto > 0:  # dá a volta: a trilha é um loop
        buf[:resto] += x[fim - i:] * g


def normalizar(x, pico_db=-1.0):
    m = np.max(np.abs(x)) or 1.0
    return x / m * 10 ** (pico_db / 20)


FFMPEG = os.environ.get('FFMPEG') or shutil.which('ffmpeg')


def salvar(caminho, x, mp3=False):
    """WAV mono 16 bits. Com mp3=True e ffmpeg disponível, converte para MP3 (trilhas ficam ~10x menores)."""
    os.makedirs(os.path.dirname(caminho), exist_ok=True)
    x = np.clip(normalizar(x), -1, 1)
    wav = caminho if caminho.endswith('.wav') else caminho[:-4] + '.wav'
    with wave.open(wav, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype('<i2').tobytes())
    if mp3 and FFMPEG:
        subprocess.run([FFMPEG, '-y', '-loglevel', 'error', '-i', wav, '-codec:a', 'libmp3lame', '-b:a', '160k', wav[:-4] + '.mp3'], check=True)
        os.remove(wav)


def loop_suave(x, cruz=2.0):
    """Faz o fim emendar no começo sem clique."""
    n = int(cruz * SR)
    rampa = np.linspace(0, 1, n)
    y = x.copy()
    y[:n] = x[:n] * rampa + x[-n:] * (1 - rampa)
    return y[: len(x) - n]


# ---------- instrumentos ----------
def pad(notas, d, brilho=900, desafinar=0.004, lento=0.08):
    t = t_(d)
    x = np.zeros_like(t)
    for m in notas:
        f = nf(m)
        for k, dt in enumerate((-desafinar, 0, desafinar)):
            ph = 2 * np.pi * f * (1 + dt) * t + rng.uniform(0, 6)
            x += (np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph)) / 3
    x *= 1 + 0.25 * np.sin(2 * np.pi * lento * t + rng.uniform(0, 6))
    return lp(x, brilho)


def acorde_seq(seq, d_cada, brilho=900):
    """Sequência de acordes com fusão de 1,5 s entre eles."""
    total = len(seq) * d_cada
    buf = np.zeros(int(total * SR))
    for i, notas in enumerate(seq):
        p = pad(notas, d_cada + 1.5, brilho)
        n = len(p)
        e = np.minimum(1, np.arange(n) / (1.5 * SR)) * np.minimum(1, (n - np.arange(n)) / (1.5 * SR))
        por(buf, p * e, i * d_cada)
    return buf


def batida_grave(g=1.0, f0=48):
    t = t_(0.9)
    f = f0 + 50 * np.exp(-t * 18)
    return g * np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.003, 0.35)


def tambor(g=1.0):
    t = t_(0.5)
    x = np.sin(2 * np.pi * (90 + 60 * np.exp(-t * 25)) * t) * env(len(t), 0.002, 0.16)
    return g * (x + 0.25 * bp(ruido(0.5), 200, 1200) * env(len(t), 0.001, 0.05))


def caixa(g=1.0):
    n = ruido(0.2)
    return g * (bp(n, 1500, 7000) * env(len(n), 0.001, 0.06) + 0.4 * np.sin(2 * np.pi * 190 * t_(0.2)) * env(len(n), 0.001, 0.04))


def tique(g=1.0, f=3200):
    n = ruido(0.03)
    return g * hp(n, f) * env(len(n), 0.0004, 0.006)


def dedilhado(m, d=1.2, g=1.0, brilho=3000):
    t = t_(d)
    f = nf(m)
    x = sum(a * np.sin(2 * np.pi * f * k * t) * np.exp(-t * (2 + k)) for k, a in ((1, 1), (2, 0.5), (3, 0.25), (4, 0.12)))
    return g * lp(x * np.minimum(1, t / 0.002), brilho)


def vento(d, f1=200, f2=1400, g=1.0):
    t = t_(d)
    x = bp(ruido(d), f1, f2) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.05 * t + rng.uniform(0, 6)))
    return g * x


def ondas(d, g=1.0):
    t = t_(d)
    x = lp(ruido(d), 900) * (0.25 + 0.75 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.11 * t)) ** 2)
    return g * x


# ---------- trilhas por tema ----------
def trilha(tema, ritmo):
    d = DUR + 2
    din = ritmo == 'dinamico'
    buf = np.zeros(int(d * SR))
    if tema == 'guerra':  # sonar: grave em ré, vento, pulso de coração
        buf += pad([26, 38, 45], d, 500) * 0.9
        buf += vento(d, 150, 900, 0.25)
        bpm = 96 if din else 54
        for k in range(int(d * bpm / 60)):
            por(buf, batida_grave(0.9 if k % 2 == 0 else 0.55), k * 60 / bpm)
        if din:
            for k in range(int(d * bpm / 60 * 2)):
                por(buf, tique(0.12), k * 30 / bpm)
            for k in range(int(d / 2.5)):
                por(buf, dedilhado([50, 53, 57, 55][k % 4], 2.0, 0.18, 1600), k * 2.5)
    elif tema == 'investigacao':  # perícia: relógio, pad menor em lá, pulso
        buf += acorde_seq([[45, 52, 57, 60], [41, 48, 57, 60], [43, 50, 55, 59], [40, 47, 55, 59]], d / 4, 800) * 0.7
        bpm = 120 if din else 60
        for k in range(int(d * bpm / 60)):
            por(buf, tique(0.35 if k % 2 == 0 else 0.22, 2600), k * 60 / bpm)
        for k in range(int(d * bpm / 60 / 2)):
            por(buf, batida_grave(0.5 if din else 0.3, 44), k * 120 / bpm)
        if din:
            seq = [69, 72, 76, 72, 67, 71, 74, 71]
            for k in range(int(d * 4)):
                por(buf, dedilhado(seq[k % 8], 0.5, 0.08, 2500), k * 0.25)
    elif tema == 'realeza':  # cordas em ré maior, solenes
        buf += acorde_seq([[50, 57, 62, 66], [47, 54, 59, 62], [43, 50, 59, 67], [45, 52, 61, 64]], d / 4, 1400) * 0.9
        if din:
            seq = [62, 66, 69, 74, 69, 66]
            for k in range(int(d * 3)):
                por(buf, dedilhado(seq[k % 6], 0.7, 0.14, 5000), k / 3)
            for k in range(int(d / 2)):
                por(buf, tambor(0.25), k * 2)
        else:
            for k in range(int(d / 4)):
                por(buf, dedilhado([74, 78, 81, 76][k % 4], 3.0, 0.06, 4000), k * 4 + 1)
    elif tema == 'ditadura':  # metais graves, segunda menor, caixa distante
        buf += pad([28, 40, 41], d, 450) * 0.9
        buf += vento(d, 100, 500, 0.15)
        bpm = 104 if din else 0
        if din:
            padrao = [1, 0, 1, 1, 1, 0, 1, 0]
            for k in range(int(d * bpm / 60 * 2)):
                if padrao[k % 8]:
                    por(buf, caixa(0.18), k * 30 / bpm)
            for k in range(int(d * bpm / 60)):
                por(buf, tambor(0.35 if k % 4 == 0 else 0.15), k * 60 / bpm)
        else:
            for k in range(int(d / 8)):
                for j in range(10):
                    por(buf, caixa(0.03 + 0.01 * j), k * 8 + 2 + j * 0.06)
    elif tema == 'mar':  # ondas, pad aberto, contrabaixo
        buf += ondas(d, 0.5)
        buf += acorde_seq([[38, 45, 52, 57], [36, 43, 52, 55], [41, 48, 53, 57], [43, 50, 55, 59]], d / 4, 900) * 0.6
        if din:
            for k in range(int(d * 2)):
                por(buf, dedilhado([38, 38, 45, 43][k % 4], 0.6, 0.35, 600), k * 0.5)
    elif tema == 'antiguidade':  # bordão em quinta, modo frígio, tambor de mão
        buf += pad([38, 45, 50], d, 700) * 0.8
        seq = [62, 63, 65, 67, 63, 62]
        passo = 0.5 if din else 2.0
        for k in range(int(d / passo)):
            por(buf, dedilhado(seq[k % 6], 1.5, 0.2 if din else 0.12, 3500), k * passo)
        bpm = 90 if din else 45
        for k in range(int(d * bpm / 60)):
            por(buf, tambor(0.3 if k % 2 == 0 else 0.18), k * 60 / bpm)
    buf = lp(buf, 6000)
    return loop_suave(normalizar(buf), 2.0)


# ---------- efeitos ----------
def efeitos(ritmo):
    din = ritmo == 'dinamico'
    out = {}
    # sopro (transição de cena)
    d = 0.5 if din else 0.9
    n = ruido(d)
    x = np.zeros_like(n)
    seg = 2048
    for i in range(0, len(n), seg):
        k = i / len(n)
        f = (300 + 2600 * k) if din else (200 + 900 * k)
        x[i:i + seg] = bp(n[i:i + seg], max(60, f * 0.6), min(20000, f * 1.6))
    x *= np.sin(np.pi * np.arange(len(n)) / len(n)) ** 2
    out['sopro'] = x
    # ping de sonar
    t = t_(1.8)
    out['ping'] = np.sin(2 * np.pi * 1180 * t) * env(len(t), 0.003, 0.4 if din else 0.32)
    # tique de contador
    out['tique'] = tique(1.0, 2800 if din else 2200)
    # tecla de máquina de escrever
    n = ruido(0.06)
    out['tecla'] = hp(n, 1500) * env(len(n), 0.0005, 0.012) + 0.3 * np.sin(2 * np.pi * 220 * t_(0.06)) * env(len(n), 0.001, 0.01)
    # carimbo: batida grave + papel
    out['carimbo'] = batida_grave(1.0, 42) + 0.3 * bp(ruido(0.9), 800, 4000) * env(int(0.9 * SR), 0.001, 0.03)
    # clique (painel abrindo / foto entrando)
    n = ruido(0.08)
    out['clique'] = hp(n, 2500) * env(len(n), 0.0005, 0.01) + 0.5 * np.sin(2 * np.pi * 900 * t_(0.08)) * env(len(n), 0.001, 0.015)
    # impacto (número grande, virada)
    imp = batida_grave(1.0, 38)
    if din:
        imp = imp + 0.5 * lp(ruido(0.9), 2500) * env(int(0.9 * SR), 0.001, 0.12)
    out['impacto'] = imp
    # pop (pino aparecendo)
    t = t_(0.15)
    out['pop'] = np.sin(2 * np.pi * (500 + 700 * np.exp(-t * 40)) * t) * env(len(t), 0.001, 0.04)
    return out


TEMAS = ['guerra', 'investigacao', 'realeza', 'ditadura', 'mar', 'antiguidade']

if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not args:
        print(__doc__)
        sys.exit(1)
    saida = args[0]
    so = TEMAS
    if '--so' in sys.argv:
        so = sys.argv[sys.argv.index('--so') + 1].split(',')
    for tema in so:
        for ritmo in ('serio', 'dinamico'):
            salvar(os.path.join(saida, 'trilhas', f'{tema}-{ritmo}.wav'), trilha(tema, ritmo), mp3=True)
            print('trilha', tema, ritmo)
    for ritmo in ('serio', 'dinamico'):
        for nome, x in efeitos(ritmo).items():
            salvar(os.path.join(saida, 'efeitos', ritmo, f'{nome}.wav'), x)
        print('efeitos', ritmo)
    print('pronto em', saida)
    if not FFMPEG:
        print('Aviso: sem ffmpeg as trilhas ficaram em .wav. No plano use  som: { ..., extensao: \'wav\' }')
