import React from 'react';
import { motion } from 'framer-motion';

const reviews = [
  { name: 'Ayesha K.', role: 'Citizen', quote: 'NexaCivic made it easy to report potholes near my home. Response times improved dramatically.' },
  { name: 'Rohan S.', role: 'Municipal Officer', quote: 'The dashboard analytics helped us allocate field crews efficiently.' },
  { name: 'Leena T.', role: 'Community Volunteer', quote: 'The system is smooth, clean, and community-friendly.' },
];

const Testimonials = () => (
  <section className="section" id="testimonials">
    <h2>Trusted by Communities</h2>
    <div className="testimonial-grid">
      {reviews.map((item, idx) => (
        <motion.article
          className="testimonial-card"
          key={`${item.name}-${idx}`}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.1 * idx }}
        >
          <p>“{item.quote}”</p>
          <div>
            <strong>{item.name}</strong>
            <span>{item.role}</span>
          </div>
        </motion.article>
      ))}
    </div>
  </section>
);

export default Testimonials;
