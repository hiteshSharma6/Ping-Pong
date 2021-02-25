const totalColor = 20;

const colors = [
    "212, 89, 89",
    "212, 140, 89",
    "212, 181, 89",
    "212, 212, 89",
    "179, 212, 89",
    "140, 212, 89",
    "101, 212, 89",
    "89, 212, 118",
    "89, 212, 154",
    "89, 212, 185",
    "89, 208, 212",
    "89, 161, 212",
    "89, 130, 212",
    "89, 95, 212",
    "118, 89, 212",
    "142, 89, 212",
    "198, 89, 212",
    "212, 89, 187",
    "212, 89, 157",
    "212, 89, 126"
];
const hexColors = [
    "0xd45959",
    "0xd48c59",
    "0xd4b559",
    "0xd4d459",
    "0xb3d459",
    "0x8cd459",
    "0x65d459",
    "0x59d476",
    "0x59d49a",
    "0x59d4b9",
    "0x59d0d4",
    "0x59a1d4",
    "0x5982d4",
    "0x595fd4",
    "0x7659d4",
    "0x8e59d4",
    "0xc659d4",
    "0xd459bb",
    "0xd4599d",
    "0xd4597e"
];


// function Color() {
//     this.colorList = {};
// }


 function newColor () {
    const num = Math.round(Math.random() * totalColor);
    return {
        rgb: colors[num],
        hex: hexColors[num]
    }
}


// Color.prototype.save = function (id, colorObj) {
//     this.colorList[id] = colorObj;
// }


// Color.prototype.getFor = function (id) {
//     return this.colorList[id];
// }