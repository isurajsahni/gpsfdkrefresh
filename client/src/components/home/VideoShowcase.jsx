import { useState, useRef, useEffect } from 'react';
import felinePreferenceVid from '../../assets/videos/Feline Preference.mp4';
import dreamingInColorsVid from '../../assets/videos/Dreaming In Colors.mp4';
import palmSpringsProwlVid from '../../assets/videos/Palm Springs Prowl.mp4';
import theSentinelVid from '../../assets/videos/The Sentinel.mp4';

const VideoShowcase = () => {
  const [mutedStates, setMutedStates] = useState([true, true, true, true]);
  const videoRefs = useRef([]);

  const videosData = [
    {
      id: 'feline-preference',
      name: 'Feline Preference',
      src: felinePreferenceVid,
      buyUrl: 'https://www.gpsfdk.com/product/feline-preference',
    },
    {
      id: 'dreaming-in-colors',
      name: 'Dreaming in Colors',
      src: dreamingInColorsVid,
      buyUrl: 'https://www.gpsfdk.com/product/dreaming-in-colors',
    },
    {
      id: 'palm-springs-prowl',
      name: 'Palm Springs Prowl',
      src: palmSpringsProwlVid,
      buyUrl: 'https://www.gpsfdk.com/product/palm-springs-prowl',
    },
    {
      id: 'the-sentinel',
      name: 'The Sentinel',
      src: theSentinelVid,
      buyUrl: 'https://www.gpsfdk.com/product/the-sentinel',
    },
  ];

  // Direct sync of DOM muted property to avoid React attribute-property syncing mismatch
  useEffect(() => {
    mutedStates.forEach((isMuted, index) => {
      if (videoRefs.current[index]) {
        videoRefs.current[index].muted = isMuted;
      }
    });
  }, [mutedStates]);

  const handleMuteToggle = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    setMutedStates((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  return (
    <section className="py-20 md:py-28 bg-[#fafaf9] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-[#2D4A3E] uppercase tracking-tight">
            Artworks in Motion
          </h2>
          <div className="w-20 h-[3px] bg-[#E3543A] mt-6 mx-auto" />
        </div>

        {/* Responsive Grid Layout */}
        <div className="grid grid-cols-2 min-[786px]:grid-cols-4 gap-4 min-[786px]:gap-6">
          {videosData.map((video, index) => (
            <a
              key={video.id}
              href={video.buyUrl}
              className="group block relative w-full aspect-[9/16] rounded-[2rem] overflow-hidden shadow-lg bg-black transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border border-gray-100/50"
            >
              {/* Autoplaying looping video */}
              <video
                ref={(el) => (videoRefs.current[index] = el)}
                src={video.src}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                loop
                muted
                playsInline
                autoPlay
              />

              {/* Sophisticated Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10 opacity-80 transition-opacity duration-300 group-hover:opacity-95" />

              {/* Text & Buy Button Content Overlay */}
              <div className="absolute inset-0 p-4 md:p-6 flex flex-col justify-end">
                {/* Product Title */}
                <h3 className="text-white font-heading text-sm md:text-lg font-bold mb-3 tracking-wide drop-shadow-md pr-6 line-clamp-2">
                  {video.name}
                </h3>

                {/* Buy Button (leaves spacing on the right for the unmute floating button) */}
                <div className="pr-10 md:pr-12">
                  <span className="inline-block w-full text-center bg-[#E3543A] text-white font-bold text-[10px] md:text-xs py-2 md:py-2.5 px-2 rounded-full transition-all duration-300 hover:bg-[#c93d25] shadow-md uppercase tracking-wider">
                    Buy Now
                  </span>
                </div>
              </div>

              {/* Independent Mute / Unmute Button at bottom-right of the video */}
              <button
                onClick={(e) => handleMuteToggle(e, index)}
                className="absolute bottom-4 right-4 z-20 flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white hover:bg-black/60 hover:scale-110 transition-all duration-300 shadow-lg"
                aria-label={mutedStates[index] ? "Unmute video" : "Mute video"}
                title={mutedStates[index] ? "Unmute" : "Mute"}
              >
                {mutedStates[index] ? (
                  /* Muted speaker icon SVG */
                  <svg
                    className="w-4 h-4 md:w-5 md:h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6L4.5 9H1.5v6h3l4.5 4.5V4.5z"
                    />
                  </svg>
                ) : (
                  /* Unmuted speaker icon SVG */
                  <svg
                    className="w-4 h-4 md:w-5 md:h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
                    />
                  </svg>
                )}
              </button>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VideoShowcase;
