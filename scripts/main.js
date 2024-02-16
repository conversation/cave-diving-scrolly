gsap.registerPlugin(ScrollTrigger);

function createIntroParallax() {
  gsap.to(".intro_figures", {
    opacity: 0,
    y: "30%",
    scrollTrigger: {
      trigger: ".intro_wrapper",
      start: "top top",
      end: "bottom top",
      scrub: true,
    },
  });

  gsap.to(".intro_copy", {
    opacity: 1,
    scrollTrigger: {
      trigger: ".intro_wrapper",
      start: "top top",
      end: "bottom 50%",
      scrub: true,
    },
  });
}

function createScrollFades() {
  gsap.utils.toArray(".pinned_parent_wrapper").forEach((pinnedSection) => {
    const bgArr = pinnedSection.querySelector(".pinned_media").children;

    const parTriggersArr = pinnedSection.querySelectorAll(".chapter");

    parTriggersArr.forEach((par, index) => {
      ScrollTrigger.create({
        trigger: par,
        start: "top 90%",
        onEnter: () => {
          bgArr[par.dataset.imageIndex || index + 1].classList.add(
            "make_visible"
          );
        },
        onLeaveBack: () => {
          bgArr[par.dataset.imageIndex || index + 1].classList.remove(
            "make_visible"
          );
        },
      });
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  createIntroParallax();
  createScrollFades();

  document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
    img.addEventListener("load", function () {
      ScrollTrigger.refresh();
    });
  });
});
