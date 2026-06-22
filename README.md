# Pure Cross Position Markov Scanner

Next.js app untuk scan digit 4D berbasis Markov murni.

Model sekarang tidak lagi memakai hybrid frequency, recency, delta, atau cycle untuk ranking utama.

Core scoring:

- AS target dihitung dari AS→AS, KOP→AS, KPL→AS, EKR→AS
- KOP target dihitung dari AS→KOP, KOP→KOP, KPL→KOP, EKR→KOP
- KPL target dihitung dari AS→KPL, KOP→KPL, KPL→KPL, EKR→KPL
- EKR target dihitung dari AS→EKR, KOP→EKR, KPL→EKR, EKR→EKR

Contoh: digit EKR 1 tidak hanya dinilai dari EKR→EKR 1, tapi juga dari AS→EKR 1, KOP→EKR 1, dan KPL→EKR 1.

Run:

```bash
npm install
npm run dev
```

Deploy note: use branch main. Config file is next.config.mjs.
