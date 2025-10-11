import React from "react";
import { motion } from "framer-motion";

export default function About() {
  return (
    <div className="bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center px-6 py-20 my-10  border border-neutral-800 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl text-center leading-relaxed"
      >
        <h1 className="text-5xl font-bold tracking-tight mb-8">About Throtl</h1>
        <p className="text-neutral-400 text-lg mb-6">
          Throtl is built to give teams control over their network bandwidth — automatically
          detecting and throttling bandwidth hogs so every device gets a fair share.
        </p>
        <p className="text-neutral-400 text-lg mb-6">
          Designed for simplicity and performance, Throtl provides real-time monitoring,
          intelligent traffic shaping, and a clean interface that lets you manage your
          network without the complexity.
        </p>
        <p className="text-neutral-400 text-lg mb-10">
          It started as a hackathon idea — now it’s evolving into a fully functional
          network management platform. Whether you’re running a home network, office setup,
          or public Wi-Fi, Throtl helps you keep things smooth, fair, and fast.
        </p>
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="inline-block"
        >
          <a
            href="/contact"
            className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-neutral-200 transition-all"
          >
            Contact Us
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
}
