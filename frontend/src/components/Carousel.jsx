import { useState } from 'react';

export default function Carousel({ images, title, subtitle, children }) {
  const slides = images && images.length > 0 ? images : [];
  const [index, setIndex] = useState(0);

  if (slides.length === 0) return null;

  const go = (next) => setIndex((next + slides.length) % slides.length);

  return (
    <div className="carousel">
      {slides.map((src, i) => (
        <img
          key={`${src}-${i}`}
          src={src}
          alt={i === 0 ? title || 'Venue photo' : ''}
          className={`carousel__img${i === index ? ' is-active' : ''}`}
          loading={i === 0 ? 'eager' : 'lazy'}
        />
      ))}

      <div className="carousel__scrim" />

      {slides.length > 1 && (
        <>
          <button
            type="button"
            className="carousel__nav carousel__nav--prev"
            onClick={() => go(index - 1)}
            aria-label="Previous photo"
          >
            ‹
          </button>
          <button
            type="button"
            className="carousel__nav carousel__nav--next"
            onClick={() => go(index + 1)}
            aria-label="Next photo"
          >
            ›
          </button>
          <div className="carousel__dots">
            {slides.map((src, i) => (
              <button
                key={`dot-${src}-${i}`}
                type="button"
                className={`carousel__dot${i === index ? ' is-active' : ''}`}
                onClick={() => setIndex(i)}
                aria-label={`Go to photo ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}

      <div className="carousel__caption">
        <div className="carousel__caption-inner">
          {title && <h1 className="carousel__title">{title}</h1>}
          {subtitle && <p className="carousel__sub">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}
