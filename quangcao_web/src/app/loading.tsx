import { motion } from "framer-motion";
import Lottie from "lottie-react";
import loadingRocket from "../assets/loading.json"; // JSON từ LottieFiles

export default function WOWLoadingPage() {
  return (
    <div className="w-screen h-screen bg-gradient-to-tr from-[#0f0c29] via-[#302b63] to-[#24243e] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background animation blur balls */}
      <div className="absolute top-0 left-0 w-72 h-72 rounded-full filter blur-3xl opacity-30 animate-pulse" />
      <div className="absolute bottom-0 right-0 w-72 h-72rounded-full filter blur-3xl opacity-20 animate-pulse" />
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1 }}
        className="w-64 h-64"
      >
        <Lottie animationData={loadingRocket} loop={true} />
      </motion.div>
    </div>
  );
}
