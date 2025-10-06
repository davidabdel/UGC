"use client";

import { useEffect, useRef } from "react";

type Props = {
  src: string;
  className?: string;
  rounded?: string; // tailwind rounded class
  poster?: string;
  ariaLabel?: string;
};

export default function HoverPlayVideo({ src, className = "", rounded = "rounded-xl", poster, ariaLabel }: Props) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    // Desktop: hover play/pause
    function onEnter() {
      const v = ref.current;
      if (!v) return;
      v.muted = true; // ensure muted for autoplay policies
      v.play().catch(() => {});
    }
    function onLeave() {
      const v = ref.current;
      if (!v) return;
      v.pause();
      v.currentTime = 0;
    }

    video.addEventListener("mouseenter", onEnter);
    video.addEventListener("mouseleave", onLeave);

    return () => {
      video.removeEventListener("mouseenter", onEnter);
      video.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <video
      ref={ref}
      className={className}
      aria-label={ariaLabel}
      muted
      playsInline
      preload="metadata"
      loop
      poster={poster}
    >
      <source src={src} type="video/webm" />
    </video>
  );
}
