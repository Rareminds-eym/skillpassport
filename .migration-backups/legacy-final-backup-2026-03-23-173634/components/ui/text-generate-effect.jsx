/**
 * Text Generate Effect Component
 * Inspired by Aceternity UI - Creates a typewriter-like text reveal animation
 */

import { useEffect, useState } from 'react';
import { motion, stagger, useAnimate } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * TextGenerateEffect - Animates text word by word with a fade-in effect
 * @param {string} words - The text to animate
 * @param {string} className - Additional CSS classes
 * @param {object} filter - Whether to apply blur filter during animation
 * @param {number} duration - Animation duration per word
 */
export const TextGenerateEffect = ({
    words,
    className,
    filter = true,
    duration = 0.5
}) => {
    const [scope, animate] = useAnimate();
    const [hasAnimated, setHasAnimated] = useState(false);
    
    // Split words into array
    const wordsArray = words?.split(' ') || [];

    useEffect(() => {
        if (scope.current && !hasAnimated && wordsArray.length > 0) {
            animate(
                'span',
                {
                    opacity: 1,
                    filter: filter ? 'blur(0px)' : 'none',
                },
                {
                    duration: duration,
                    delay: stagger(0.08),
                }
            );
            setHasAnimated(true);
        }
    }, [scope, animate, filter, duration, hasAnimated, wordsArray.length]);

    const renderWords = () => {
        return (
            <motion.div ref={scope}>
                {wordsArray.map((word, idx) => (
                    <motion.span
                        key={word + idx}
                        className="text-gray-300 opacity-0"
                        style={{
                            filter: filter ? 'blur(10px)' : 'none',
                        }}
                    >
                        {word}{' '}
                    </motion.span>
                ))}
            </motion.div>
        );
    };

    return (
        <div className={cn('font-normal', className)}>
            <div className="leading-relaxed text-base">
                {renderWords()}
            </div>
        </div>
    );
};

/**
 * TextGenerateEffectOnce - Same effect but only animates once when in view
 */
export const TextGenerateEffectOnce = ({
    words,
    className,
    filter = true,
    duration = 0.5
}) => {
    const [scope, animate] = useAnimate();
    const [hasAnimated, setHasAnimated] = useState(false);
    
    const wordsArray = words?.split(' ') || [];

    useEffect(() => {
        if (!hasAnimated && wordsArray.length > 0) {
            // Small delay to ensure component is mounted
            const timer = setTimeout(() => {
                animate(
                    'span',
                    {
                        opacity: 1,
                        filter: filter ? 'blur(0px)' : 'none',
                    },
                    {
                        duration: duration,
                        delay: stagger(0.06),
                    }
                );
                setHasAnimated(true);
            }, 100);
            
            return () => clearTimeout(timer);
        }
    }, [animate, filter, duration, hasAnimated, wordsArray.length]);

    return (
        <div className={cn('font-normal', className)}>
            <motion.div ref={scope} className="leading-relaxed text-base">
                {wordsArray.map((word, idx) => (
                    <motion.span
                        key={word + idx}
                        className="text-gray-300 opacity-0 inline-block mr-1"
                        style={{
                            filter: filter ? 'blur(8px)' : 'none',
                        }}
                    >
                        {word}
                    </motion.span>
                ))}
            </motion.div>
        </div>
    );
};

export default TextGenerateEffect;
