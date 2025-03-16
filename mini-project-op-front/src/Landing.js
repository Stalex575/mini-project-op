import { useState, useEffect } from "react";
export default function Landing() {
  const [showTopBtn, setShowTopBtn] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > window.innerHeight) {
        setShowTopBtn(true);
      } else {
        setShowTopBtn(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
  return (
    <div className="wrapper">
      <section className="hero">
        <div className="hero-text">
          <h1 className="hero-title">Evacuation made easy</h1>
          <p className="hero-description">
            Find best routes to evacuate citizens from Ukrainian warzone. Made
            to suit any circumstances. For your convenience.
          </p>
        </div>
        <button className="action-button">To map</button>
      </section>
      <section className="guide">
        <h1 className="section-title">How to use it?</h1>
        <p className="section-subtitle">
          Watch a short video-guide to get started.
        </p>
        <iframe
          className="video"
          src="https://www.youtube.com/embed/xvFZjo5PgG0"
          title="Rick Roll (Different link + no ads)"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen
        ></iframe>
      </section>
      <section className="contacts">
        <h1 className="section-title">Contact us!</h1>
        <p className="section-subtitle">
          If you have questions or suggestions send us an email.
        </p>
        <button className="action-button">Email us!</button>
      </section>
      <footer>
        <p>
          Lorem ipsum dolor sit, amet consectetur adipisicing elit. Sit, harum?
        </p>
      </footer>
      <button
        className={`scroll-to-top ${showTopBtn ? "visible" : ""}`}
        onClick={scrollToTop}
        aria-label="Scroll to top"
      >
        ↑
      </button>
    </div>
  );
}
