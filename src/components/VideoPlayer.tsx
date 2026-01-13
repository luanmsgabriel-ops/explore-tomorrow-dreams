import { useState } from 'react';
import { Play, X } from 'lucide-react';
import { DestinationVideo } from '@/data/destinations';

interface VideoPlayerProps {
  videos: DestinationVideo[];
  destinationName: string;
}

export const VideoPlayer = ({ videos, destinationName }: VideoPlayerProps) => {
  const [selectedVideo, setSelectedVideo] = useState<DestinationVideo | null>(null);

  if (videos.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground rounded-2xl border border-border">
        Nenhum vídeo disponível para este destino
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <div
            key={video.id}
            onClick={() => setSelectedVideo(video)}
            className="group cursor-pointer"
          >
            <div className="relative aspect-video rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all">
              {/* YouTube Thumbnail */}
              <img
                src={`https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`}
                alt={video.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  // Fallback to medium quality if maxres not available
                  (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`;
                }}
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
              
              {/* Play button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform shadow-lg">
                  <Play className="w-7 h-7 text-primary-foreground ml-1" fill="currentColor" />
                </div>
              </div>
              
              {/* Title */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-foreground font-medium text-sm line-clamp-2">{video.title}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/95 backdrop-blur-sm"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="relative w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute -top-12 right-0 p-2 rounded-full bg-secondary hover:bg-muted transition-colors z-10"
            >
              <X className="w-6 h-6 text-foreground" />
            </button>
            
            <div className="aspect-video rounded-2xl overflow-hidden border border-border shadow-2xl">
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1&rel=0`}
                title={selectedVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
            
            <div className="mt-4 text-center">
              <h3 className="font-serif text-xl font-bold text-foreground">{selectedVideo.title}</h3>
              <p className="text-muted-foreground text-sm mt-1">{destinationName}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
