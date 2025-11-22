import { motion } from "framer-motion";
import Lottie from "lottie-react";
import loadingRocket from "../assets/loading.json"; // JSON từ LottieFiles
import { LogoAdmake } from "../components/chat/components/Conversation/Header";

export default function WOWLoadingPage() {
  return (
    <div className="w-screen h-screen bg-gradient-to-tr from-[#0f0c29] via-[#302b63] to-[#24243e] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background animation blur balls */}
      <div className="absolute top-0 left-0 w-72 h-72 rounded-full filter blur-3xl opacity-30 animate-pulse" />
      <div className="absolute bottom-0 right-0 w-72 h-72rounded-full filter blur-3xl opacity-20 animate-pulse" />
      <motion.div
        initial={{ scale: 2, opacity: 0 }}
        animate={{
          scale: [2, 2.2, 2], // zoom in rồi zoom out lặp lại
          opacity: [0, 1, 0.8],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatType: "loop",
          ease: "easeInOut",
        }}
        className="w-64 h-64 flex flex-col items-center justify-center"
      >
        <LogoAdmake />

        
      </motion.div>

      <motion.p
        initial={{ x: -200, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 100, opacity: 0 }}
        transition={{ duration: 3 }}
      >
        <p style={{color:'white', fontSize: 20, fontStyle:'italic'}}>Giải pháp làm nghề thời đại số</p>
      </motion.p>
    </div>
  );
}
