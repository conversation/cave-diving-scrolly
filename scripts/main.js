gsap.registerPlugin(ScrollTrigger);

function createScrollFades() {
  gsap.utils.toArray(".pinned_section").forEach((pinnedSection) => {
    const bgArr = pinnedSection.querySelector(".pinned_media").children;

    const parTriggersArr = pinnedSection.querySelectorAll(".chapter");

    parTriggersArr.forEach((par, index) => {
      ScrollTrigger.create({
        fastScrollEnd: true,
        trigger: par,
        start: `top ${par.classList.contains("delay") ? "70" : "90"}%`,
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
        .scale(window.innerWidth < 600 ? 40000 : 50000)
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

      const filteredData = caveLocations.features.filter((d) => {
        return (
          caveNames.some((cave) => d.properties.name.includes(cave)) ||
          d.properties.name === "Mount Gambier"
        );
      });

      function checkIfMtGambier(d) {
        return d.properties.name === "Mount Gambier";
      }

      pointsGroup
        .selectAll("path")
        .data(filteredData)
        .join("line")
        .attr("x1", (d) => projection(d.geometry.coordinates)[0])
        .attr(
          "y1",
          (d) =>
            projection(d.geometry.coordinates)[1] +
            calcDistance(d.properties.name) -
            (d.properties.name === "Engelbrecht Cave" ? -10 : 20)
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
          } else if (checkIfMtGambier(d)) {
            return "#ffc338";
          } else {
            return "#29339b";
          }
        })
        .style("opacity", 0)
        .on("mouseover", function (event, d) {
          console.log(event);
        });

      // Add text elements temporarily to measure them
      const tempText = pointsGroup
        .selectAll(null)
        .data(filteredData)
        .enter()
        .append("text")
        .style("opacity", 0)
        .style("font-family", "var(--font-family--base)")
        .style("font-style", (d) => (checkIfMtGambier(d) ? "italic" : "none"))
        .style("font-weight", (d) =>
          checkIfMtGambier(d) ? "" : "var(--font-weight--bold)"
        )
        .text((d) => d.properties.name)
        .each(function (d) {
          d.bbox = this.getBBox();
        });

      // Add rectangles based on text bounding boxes
      pointsGroup
        .selectAll("rect")
        .data(filteredData)
        .enter()
        .append("rect")
        .attr(
          "x",
          (d) => projection(d.geometry.coordinates)[0] - (d.bbox.width + 10) / 2
        )
        .attr(
          "y",
          (d) =>
            projection(d.geometry.coordinates)[1] +
            calcDistance(d.properties.name) -
            (d.bbox.height + 16) / 2
        )
        .style("width", (d) => `${d.bbox.width + 10}px`)
        .style("height", (d) => `${d.bbox.height + 5}px`)
        .attr("fill", "rgba(255,255,255,0.7)")
        .style("opacity", 0);

      // Now add the actual text elements on top of the rectangles
      pointsGroup
        .selectAll(null)
        .data(filteredData)
        .enter()
        .append("text")
        .attr("x", (d) => projection(d.geometry.coordinates)[0])
        .attr(
          "y",
          (d) =>
            projection(d.geometry.coordinates)[1] +
            calcDistance(d.properties.name)
        )
        .attr("text-anchor", "middle")
        .attr("class", (d) =>
          checkIfMtGambier(d) ? "town_label" : "cave_label"
        )
        .attr("fill", "#000")
        .style("opacity", 0)
        .style("font-family", "var(--font-family--base)")
        // .style("font-style", (d) => (checkIfMtGambier(d) ? "italic" : "none"))
        .style("font-weight", (d) =>
          checkIfMtGambier(d) ? "" : "var(--font-weight--bold)"
        )
        .text((d) => d.properties.name);

      // Remove the temporary text elements after measuring
      tempText.remove();

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
        .attr("transform", `translate(20,${height - insetHeight - 10})`)
        .selectAll("path")
        .data(australia.features)
        .enter()
        .append("path")
        .attr("d", d3.geoPath().projection(insetProjection))
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
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 2);

      // ------ Scroll trigger ------- //

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
        [".points_group text", ".points_group line", ".points_group rect"],
        {
          opacity: 1,
          stagger: {
            grid: [1, 4],
            from: "start",
            axis: "x",
            each: 0.3,
          },
        },
        "-=2"
      );

      ScrollTrigger.create({
        animation: tl,
        scrub: true,
        fastScrollEnd: true,
        trigger: ".map_chapter .chapter",
        start: "top 70%",
        end: "top top",
      });
    }

    drawMap(window.innerWidth, window.innerHeight);

    let cachedWidth = window.innerWidth;

    window.addEventListener("resize", () => {
      let newWidth = window.innerWidth;

      // Check if width has changed, if not then must be mobile resize
      if (newWidth !== cachedWidth) {
        drawMap(newWidth, window.innerHeight);
        cachedWidth = newWidth;
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector(".intro_video").addEventListener("playing", () => {
    document.querySelector(".intro_copy").classList.add("animate_title");
  });

  // Lazy load videos
  new LazyLoad({
    threshold: 600,
  });

  createMap();
  createScrollFades();

  document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
    img.addEventListener("load", function () {
      ScrollTrigger.refresh();
    });
  });
});
