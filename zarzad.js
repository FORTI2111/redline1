fetch("https://redline.umod.pl/api/pracownicy")
.then(res => res.json())
.then(users => {
    const container = document.getElementById("pracownicy-list");

    users.forEach(user => {
        const div = document.createElement("div");
        div.className = "user-card";

        div.innerHTML = `
            <img src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png">
            <span>${user.username}</span>
        `;

        container.appendChild(div);
    });
});