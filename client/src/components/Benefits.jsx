import React from 'react';
import { ShieldCheck, Clock, Heart, Globe } from 'lucide-react';

const benefits = [
  { icon: <ShieldCheck size={20} />, title: 'Trust & Transparency', text: 'Audit-ready issue history and response logs.' },
  { icon: <Clock size={20} />, title: 'Faster Resolution', text: 'Workflow automation and SLA enforcement built in.' },
  { icon: <Heart size={20} />, title: 'Citizen First', text: 'Ease-of-use for anyone with mobile-ready forms.' },
  { icon: <Globe size={20} />, title: 'Scalable', text: 'Works across neighborhoods, cities and states.' },
];

const Benefits = () => (
  <section className="section" id="benefits">
    <h2>Benefits for Everyone</h2>
    <div className="benefits-grid">
      {benefits.map((item) => (
        <article className="benefit-card" key={item.title}>
          <div className="benefit-icon">{item.icon}</div>
          <h3>{item.title}</h3>
          <p>{item.text}</p>
        </article>
      ))}
    </div>
  </section>
);

export default Benefits;
