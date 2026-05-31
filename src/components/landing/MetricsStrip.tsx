import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const MetricCounter = ({ target, duration = 2, suffix = "" }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const increment = target / (duration * 60);
      const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
          setCount(target);
          clearInterval(timer);
        } else {
          setCount(start);
        }
      }, 1000 / 60);
      return () => clearInterval(timer);
    }
  }, [isInView, target, duration]);

  return (
    <span ref={ref}>
      {target % 1 === 0 ? Math.floor(count) : count.toFixed(1)}
      {suffix}
    </span>
  );
};

const metrics = [
  {
    value: 5.0,
    label: "Avaliação média",
    suffix: "",
    icon: "⭐"
  },
  {
    value: 100,
    label: "Destinos atendidos",
    suffix: "+",
    icon: "📍"
  },
  {
    value: 24,
    label: "Atendimento especializado",
    suffix: "/7",
    icon: "💬"
  },
  {
    value: 100,
    label: "Acompanhamento completo",
    suffix: "%",
    icon: "✈️"
  }
];

export const MetricsStrip = () => {
  return (
    <section className="py-20 border-y border-white/5 bg-black/20 backdrop-blur-sm overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
          {metrics.map((m, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <span className="text-2xl mb-4">{m.icon}</span>
              <div className="text-4xl md:text-5xl font-editorial text-gold mb-2">
                <MetricCounter target={m.value} suffix={m.suffix} />
              </div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold">
                {m.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
