import { motion } from "framer-motion";
import React from "react";
import { useState } from "react";

export const AnimatedChart = ({ children, scrollRoot, aspectClass="aspect-auto" }) => {
    const [hasEntered, setHasEntered] = useState(false);

    return (
        <motion.div
            className={`w-full ${aspectClass} flex justify-center`}
            initial={{ 
                opacity: 0
            }}

            whileInView={{
                opacity: 1,
            }}

            viewport={{
                root: scrollRoot,
                once: true,
                amount: "all",
            }}

            onViewportEnter={
                () => setHasEntered(true)
            }
        >
            {hasEntered && children}
        </motion.div>
    )
}