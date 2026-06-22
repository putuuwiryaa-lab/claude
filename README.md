# Pure Cross Position Markov Scanner

Next.js app untuk scan digit berbasis Markov murni.

Model sekarang tidak lagi memakai hybrid frequency, recency, delta, atau cycle untuk ranking utama.

Core scoring:

- AS target dihitung dari AS ke AS, KOP ke AS, KPL ke AS, EKR ke AS
- KOP target dihitung dari AS ke KOP, KOP ke KOP, KPL ke KOP, EKR ke KOP
- KPL target dihitung dari AS ke KPL, KOP ke KPL, KPL ke KPL, EKR ke KPL
- EKR target dihitung dari AS ke EKR, KOP ke EKR, KPL ke EKR, EKR ke EKR

Contoh: digit EKR 1 tidak hanya dinilai dari EKR ke EKR 1, tapi juga dari AS ke EKR 1, KOP ke EKR 1, dan KPL ke EKR 1.

Run:

```bash
npm install
npm run dev
```

Deploy note: use branch main. Config file is next.config.mjs.
