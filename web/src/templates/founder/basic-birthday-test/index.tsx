import React from "react";
import { motion } from "framer-motion";

type TemplateProps = {
  recipientName: string;
  senderName: string;
  message: string;
  photos: string[];
  musicUrl?: string;
  previewMode?: boolean;
};

export default function BasicBirthdayTemplate({
  recipientName,
  senderName,
  message,
  photos,
}: TemplateProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 to-purple-300 flex flex-col items-center justify-center p-10">
      <motion.h1
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-5xl font-bold text-white"
      >
        Happy Birthday {recipientName} 🎂
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-2xl text-white"
      >
        From {senderName}
      </motion.p>

      <motion.p
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1 }}
        className="mt-6 max-w-xl text-center text-lg text-white"
      >
        {message}
      </motion.p>

      {photos?.[0] && (
        <motion.img
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          src={photos[0]}
          alt="wish"
          className="mt-8 w-72 h-72 rounded-2xl object-cover shadow-2xl"
        />
      )}
    </div>
  );
}