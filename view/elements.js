const main = document.getElementsByTagName("main")[0];

function deleteElement(ele) {
    document.getElementsByTagName("main")[0].removeChild(document.getElementById(ele));
}

function fadeOut(ele) {
    document.getElementById(ele).classList.add("fade");
}

function createLoader() {
    main.innerHTML = `
        <div id="loader">
            <div id="circle"></div>
            <h2>Finding a match</h2>
        </div>
    `;
}

function createMatch(player1, player2, thisPlayer) {
    main.innerHTML = `
        <div id="match">
            <div class="p">
                <div id="p1">
                    <span id="p1-name">${player1.id}</span>
                </div>
                <div id="right-arr"></div>
            </div>
            <h2>VS</h2>
            <div class="p">
                <div id="left-arr"></div>
                <div id="p2">
                    <span id="p2-name">${player2.id}</span>
                </div>
            </div>
        </div>
    `;

    const color1 = newColor();
    const color2 = newColor();
    player1.setColor(color1.hex);
    player2.setColor(color2.hex);
    
    const p1 = document.getElementById("p1");
    const rArrStyle = document.getElementById("right-arr").style;
    p1.style.boxShadow = `inset 0 0 30px rgba(${color1.rgb}, 0.2)`;
    rArrStyle.borderLeftColor = `rgba(${color1.rgb}, 0.2)`;

    const p2 = document.getElementById("p2");
    const lArrStyle = document.getElementById("left-arr").style;
    p2.style.boxShadow = `inset 0 0 30px rgba(${color2.rgb}, 0.2)`;
    lArrStyle.borderRightColor = `rgba(${color2.rgb}, 0.2)`;

    (thisPlayer === player1.id)
        ? p1.style.boxShadow = `inset 0 0 40px rgba(${color1.rgb}, 1)`
        :  p2.style.boxShadow = `inset 0 0 40px rgba(${color2.rgb}, 1)`

    rArrStyle.borderWidth = p1.offsetHeight/2 + "px";
    lArrStyle.borderWidth = p2.offsetHeight/2 + "px";
}
