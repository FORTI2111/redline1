let currentShopCategory = "zestawy";
let cooldown = false;


const params = new URLSearchParams(window.location.search);
const userParam = params.get("user");

if (userParam) {
    const user = JSON.parse(decodeURIComponent(userParam));

    localStorage.setItem("user", JSON.stringify(user));

    // 🔥 redirect logic
    if (user.isZarzad) {
        window.location.href = "/zarzad.html";
    } 
    else if (user.isPracownik) {
        window.location.href = "/pracownik.html";
    } 
    else {
        window.location.href = "/index.html";
    }
}

const user = JSON.parse(localStorage.getItem("user"));

if (user && user.id) {
    document.querySelector(".login-btn").style.display = "none";
    document.getElementById("user-info").style.display = "flex";

    document.getElementById("user-name").textContent = user.username;

    document.getElementById("user-avatar").src =
        `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;

    renderRoles(user); // 🔥 TO JEST KLUCZ
}

setTimeout(() => {
  $(".loading").css("display", "none");
  $("#root").css("display", "block");
  $("#zestawy").css("display", "block");

  setTimeout(() => {
    AOS.init({ once: true });

    const observerRight = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("rightToLeft");
        }
      });
    });

    const observerLeft = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("leftToRight");
        }
      });
    });

    const box1 = document.querySelector("#box-1");
    const box2 = document.querySelector("#box-2");
    const box3 = document.querySelector("#box-3");

    if (box1) observerRight.observe(box1);
    if (box2) observerLeft.observe(box2);
    if (box3) observerRight.observe(box3);
  }, 100);
}, 2100);

function contact() {
  $(".contact-popup").css("display", "block");
  $(".contact-popup").fadeOut(0);
  $(".contact-popup").fadeIn(500);
}

function closePopup() {
  $(".contact-popup").fadeOut(500);
  setTimeout(() => {
    $(".contact-popup").css("display", "none");
  }, 600);
}

function changeCategory(elem, newCategory) {
  if (!cooldown) {
    cooldown = true;
    if (document.querySelectorAll(".categories > .selected")[0]) {
      document
        .querySelectorAll(".categories > .selected")[0]
        .classList.remove("selected");
    }
    elem.classList.add("selected");
    $("#" + currentShopCategory).animate(
      {
        left: "-200%",
      },
      275,
      function () {
        $("#" + currentShopCategory).css("display", "none");
        $("#" + newCategory).css("left", "200%");
        $("#" + newCategory).css("display", "block");
        $("#" + newCategory).animate(
          {
            left: "50%",
          },
          275,
          function () {
            currentShopCategory = newCategory;
            cooldown = false;
          }
        );
      }
    );

    document.getElementById("category-mobile-container").style.display = "none";
  }
}

function closeShopPopup() {
  $(".shop-details-popup").css("display", "none");
}

function showBuyPopup(name) {
  document.getElementById("details-image").src = document
    .getElementById(name)
    .querySelectorAll("img")[0].src;
  document.getElementById("details-label").textContent = document
    .getElementById(name)
    .querySelectorAll(".label")[0].textContent;
  document.getElementById("details-price").textContent = document
    .getElementById(name)
    .querySelectorAll(".price")[0].textContent;
  // document.getElementById('cena').value = document.getElementById(name).querySelectorAll('.price')[0].textContent;
  console.log(
    document.getElementById(name).querySelectorAll(".cenafirst")[0].value
  );
  $("#cenapop").val(
    document.getElementById(name).querySelectorAll(".cenafirst")[0].value
  );
  $("#productidpop").val(
    document.getElementById(name).querySelectorAll(".productid")[0].value
  );

  if (name == "ub1" || name == "ub2" || name == "ub3") {
    $("#banid").fadeIn(0);
  } else {
    $("#banid").fadeOut(0);
  }

  $(".shop-details-popup").css("display", "block");
}

function insertAsThird(element, parent) {
  if (parent.children.length > 2) {
    parent.insertBefore(element, parent.children[2]);
  } else parent.appendChild(element);
}

let navbar = false;

function toggleNavbar() {
  navbar = !navbar;
  if (navbar) {
    $(".navbar > .buttons").css("display", "flex");
  } else {
    $(".navbar > .buttons").css("display", "none");
  }
}

let mobileCategory = false;

function renderRoles(user) {
    const navbar = document.querySelector(".navbar .buttons");

    if (user.isZarzad) {
        const el = document.createElement("div");
        el.className = "button";
        el.innerText = "ZARZĄD";

        el.onclick = () => {
            window.location.href = "/zarzad.html";
        };

        navbar.prepend(el);
    }

    if (user.isPracownik) {
        const el = document.createElement("div");
        el.className = "button";
        el.innerText = "PRACOWNIK";

        el.onclick = () => {
            window.location.href = "/pracownik.html";
        };

        navbar.prepend(el);
    }
}

function toggleMobileCategory() {
  mobileCategory = !mobileCategory;
  if (mobileCategory) {
    document.getElementById("category-mobile-container").style.display =
      "block";
    document.getElementById(currentShopCategory).style.display = "none";
  } else {
    document.getElementById("category-mobile-container").style.display = "none";
    document.getElementById(currentShopCategory).style.display = "block";
  }
}

const postScroll = document.getElementById("categories");

if (postScroll) {
    let scrollingHorizontally = true;

    postScroll.addEventListener("wheel", (event) => {
        if (scrollingHorizontally) {
            postScroll.scrollBy({
                left: event.deltaY < 0 ? -70 : 70,
            });
            event.preventDefault();
        }
    });
}

const popup = document.querySelector(".contact-popup");

if (popup) {
    popup.addEventListener("click", function(e) {
        if (e.target === this) {
            closePopup();
        }
    });
}

window.addEventListener("load", () => {
  const intro = document.getElementById("intro");

  setTimeout(() => {
    intro.style.display = "none";
  }, 4200);
});

const light = document.querySelector(".cursor-light");

document.addEventListener("mousemove", (e) => {
  light.style.left = e.clientX + "px";
  light.style.top = e.clientY + "px";
});

const boxes = document.querySelectorAll(".box");

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("show");
    }
  });
});

boxes.forEach(box => observer.observe(box));

document.addEventListener("mousemove", (e) => {
  const x = (e.clientX / window.innerWidth - 0.5) * 10;
  const y = (e.clientY / window.innerHeight - 0.5) * 10;

  document.querySelector(".landing-section-1").style.transform =
    `translate(${x}px, ${y}px) scale(1.02)`;
});
