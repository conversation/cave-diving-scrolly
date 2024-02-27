gsap.registerPlugin(ScrollTrigger);

function createIntroParallax() {
  gsap.to(".intro_copy", {
    ease: "power1.inOut",
    opacity: 1,
    duration: 4,
    delay: 2,
  });
}

function createScrollFades() {
  gsap.utils.toArray(".pinned_parent_wrapper").forEach((pinnedSection) => {
    const bgArr = pinnedSection.querySelector(".pinned_media").children;

    const parTriggersArr = pinnedSection.querySelectorAll(".chapter");

    parTriggersArr.forEach((par, index) => {
      ScrollTrigger.create({
        fastScrollEnd: true,
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

function createMap() {
  const urls = [
    "https://cdn.theconversation.com/infographics/1022/7e89a2d3ad9ef94c953a30a7bd8994a480a9162f/site/limestoneCoastMap.json",
    "https://cdn.theconversation.com/infographics/1022/7e89a2d3ad9ef94c953a30a7bd8994a480a9162f/site/limestoneCoastCaves.json",
    "https://cdn.theconversation.com/infographics/1022/7e89a2d3ad9ef94c953a30a7bd8994a480a9162f/site/australia.json",
  ];

  Promise.all(urls.map((url) => d3.json(url))).then(function ([
    limestoneCoast,
    caveLocations,
    australia,
  ]) {
    // Sort locations so the animation occurs left-right
    caveLocations.features = caveLocations.features.sort(
      (a, b) => a.geometry.coordinates[0] - b.geometry.coordinates[0]
    );

    function drawMap(width, height) {
      let insetWidth = width / 3,
        insetHeight = height / 3;

      let projection = d3
        .geoMercator()
        .center([140.64, -37.9])
        .scale(50000)
        .translate([width * 0.5, height * 0.5]);

      let insetProjection = d3
        .geoMercator()
        .precision(100)
        .fitSize([insetWidth, insetHeight], australia);

      // Clear previous SVG contents before redrawing
      d3.select("#map1").selectAll("*").remove();

      // Select the container and append the SVG
      let svg = d3.select("#map1").attr("width", width).attr("height", height);
      const colorScale = d3.scaleOrdinal([
        "#bde5b6",
        "#8bcf89",
        "#379f54",
        "#137d3a",
        "#00471c",
      ]);

      svg
        .append("g")
        .attr("class", "map_outline")
        .selectAll("path")
        .data(limestoneCoast.features)
        .join("path")
        .attr("d", d3.geoPath().projection(projection))
        .attr("fill", (d, i) => colorScale(i))
        .attr("stroke", "#000");

      let pointsGroup = svg.append("g").attr("class", "points_group");

      let caveNames = ["Goulden", "Fossil", "Engel"];

      function calcDistance(name) {
        let distance = 50;

        switch (name) {
          case "Engelbrecht Cave":
            return -distance * 1;
          case "Fossil Cave & Tank Cave":
            return distance * 1.4;
          case "Goulden Hole":
            return distance * 0.5;
          case "Mount Gambier":
            return distance * 1.1;
          default:
            return distance;
        }
      }

      pointsGroup
        .selectAll("path")
        .data(
          caveLocations.features.filter((d) => {
            return (
              caveNames.some((cave) => d.properties.name.includes(cave)) ||
              d.properties.name === "Mount Gambier"
            );
          })
        )
        .join("line")
        .attr("x1", (d) => projection(d.geometry.coordinates)[0])
        .attr(
          "y1",
          (d) =>
            projection(d.geometry.coordinates)[1] +
            calcDistance(d.properties.name)
        )
        .attr("x2", (d) => projection(d.geometry.coordinates)[0])
        .attr("y2", (d) => projection(d.geometry.coordinates)[1])
        .style("stroke", "#000")
        .style("stroke-width", 2)
        .style("stroke-dasharray", "2, 2")
        .style("opacity", 0);

      pointsGroup
        .selectAll("circle")
        .data(caveLocations.features)
        .join("circle")
        .attr("cx", (d) => projection(d.geometry.coordinates)[0])
        .attr("cy", (d) => projection(d.geometry.coordinates)[1])
        .attr("r", 5)
        .attr("fill", (d) => {
          if (caveNames.some((cave) => d.properties.name.includes(cave))) {
            return "#e9928c";
          } else if (d.properties.name === "Mount Gambier") {
            return "#ffc338";
          } else {
            return "#29339b";
          }
        })
        .style("opacity", 0);

      pointsGroup
        .selectAll("text")
        .data(
          caveLocations.features.filter((d) => {
            return (
              caveNames.some((cave) => d.properties.name.includes(cave)) ||
              d.properties.name === "Mount Gambier"
            );
          })
        )
        .join("text")
        .attr("x", (d) => projection(d.geometry.coordinates)[0])
        .attr(
          "y",
          (d) =>
            projection(d.geometry.coordinates)[1] +
            calcDistance(d.properties.name)
        )
        .attr("text-anchor", "middle")
        .attr(
          "transform",
          (d) =>
            `translate(0,${d.properties.name === "Engelbrecht Cave" ? -5 : 15})`
        )
        .attr("fill", (d) => "#000")
        .style("opacity", 0)
        .text((d) => d.properties.name);

      const boxCorners = [
        [140, -37.6], // Top-left corner
        [141.2, -37.6], // Top-right corner
        [141.2, -38.4], // Bottom-right corner
        [140, -38.4], // Bottom-left corner
      ];

      const projectedCorners = boxCorners.map((corner) =>
        insetProjection(corner)
      );

      // Draw inset map features
      svg
        .append("g")
        .attr("class", "map_inset")
        .attr("transform", `translate(0,${height - insetHeight - 10})`)
        .selectAll("path")
        .data(australia.features)
        .enter()
        .append("path")
        .attr("d", d3.geoPath().projection(insetProjection))
        // .attr("fill", "#d6d6da")
        .attr("fill", (d, i) => colorScale(i))
        .attr("stroke", "#000")
        .style("stroke-width", 0.7);

      // Draw the red box indicating the location
      svg
        .select(".map_inset")
        .append("path")
        .attr(
          "d",
          "M" +
            projectedCorners.map((corner) => corner.join(",")).join("L") +
            "Z"
        )
        .attr("fill", "none") // No fill, only outline
        .attr("stroke", "red") // Red outline
        .attr("stroke-width", 2); // Adjust stroke width as needed

      // ------ Scroll trigger -------

      const tl = gsap.timeline({ paused: true });

      tl.to("circle", {
        opacity: 1,
        stagger: {
          grid: [68, 1],
          from: "start",
          axis: "y",
          each: 0.02,
        },
      }).to(
        [".points_group text", ".points_group line"],
        {
          opacity: 1,
          duration: 0.5,
        },
        "-=2"
      );

      ScrollTrigger.create({
        fastScrollEnd: true,
        trigger: ".map_chapter",
        start: "top 90%",
        onEnter: () => tl.play(),
      });

      ScrollTrigger.create({
        trigger: ".trigger",
        start: "top bottom",
        onLeaveBack: () => tl.pause(0),
      });
    }

    drawMap(window.innerWidth, window.innerHeight);

    window.addEventListener("resize", () => {
      drawMap(window.innerWidth, window.innerHeight);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Lazy load videos
  new LazyLoad({
    threshold: 600,
  });

  createIntroParallax();
  createMap();
  createScrollFades();

  document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
    img.addEventListener("load", function () {
      ScrollTrigger.refresh();
    });
  });
});
