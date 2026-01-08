function heroAnimation() {

var tl = gsap.timeline();

tl.from("nav", {
    y: -30,
    opacity: 0,
    duration: 1
});

tl.from(".landing-container", {
    y: 100,
    opacity: 0,
    duration: 2.5
});

}

heroAnimation();

function featuresAnimation() {

var tl2 = gsap.timeline({
    scrollTrigger: {
        trigger: "#features",
        start: "top 60%"
    }
});

tl2.from("#features h2" , {
    x: -100,
    opacity: 0,
    duration: 0.5
});

tl2.from(".card-container" , {
    y: 50,
    opacity: 0,
    duration: 1.5
});

tl2.to(".separator .path1", {
        attr: {
            d: "M50 5 H 0"
        },
        duration: 1
    }, "<");

    tl2.to(".separator .path2", {
        attr: {
            d: "M50 5 H 100"
        },
        duration: 1
    }, "<");

}

featuresAnimation();