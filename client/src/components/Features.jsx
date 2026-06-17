import React from 'react';
import { Flag, Eye, Cpu, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  { title: 'Report Issue', description: 'Submit issues with location and photos in seconds.', icon: <Flag size={24} /> },
  { title: 'Track Status', description: 'Real-time status updates from submission to resolution.', icon: <Eye size={24} /> },
  { title: 'AI Detection', description: 'Smart categorization and trend prediction with AI.', icon: <Cpu size={24} /> },
  { title: 'Community Support', description: 'Engage citizens and local teams together.', icon: <Users size={24} /> },
];

const Features = () => {
  return (
    <section className="section" id="features">
      <h2>Core Features</h2>
      <p>Designed for governments and citizens to collaborate with transparency and speed.</p>

      <div className="grid-cards">
        {features.map((item, index) => (
          <motion.article
            key={item.title}
            className="feature-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <div className="feature-icon">{item.icon}</div>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
};

export default Features;
