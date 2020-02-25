"use strict";

function $(selector) {
  let elements = document.querySelectorAll(selector);
  return elements.length > 1 ? elements : elements[0];
}

const deck = [];

{
  for (let number = 2; number <= 9; number++) {
    deck.push(number.toString());
  }
  deck.push("K");
  deck.push("J");
  deck.push("Q");
  deck.push("A");
}

const Game = {
  you: {
    scoreSpan: "#yourResult",
    div: "#yourBox",
    score: 0
  },
  dealer: {
    scoreSpan: "#dealerResult",
    div: "#dealerBox",
    score: 0
  },
  wins: 0,
  losses: 0,
  draws: 0,
  changeState: function(state) {
    Game.canHit = state === "canHit";
    Game.canStand = state === "canStand";
    Game.canDeal = state === "canDeal";
  },
  canHit: true,
  canStand: false,
  canDeal: false
};

const YOU = Game["you"];
const DEALER = Game["dealer"];

const placeCardSound = new Audio("statics/sounds/placeCard.mp3");
const lossSound = new Audio("statics/sounds/loss.mp3");
const winSound = new Audio("statics/sounds/win.mp3");
const dealSound = new Audio("statics/sounds/deal.mp3");
const standSound = new Audio("statics/sounds/stand.mp3");

$("#hitButton").addEventListener("click", Hit);
$("#standButton").addEventListener("click", Stand);
$("#dealButton").addEventListener("click", Deal);

function Hit() {
  if (Game["canHit"]) {
    if (YOU["score"] <= 21) {
      placeCard(randomCard(), YOU);
    } else {
      passTurn();
    }
  }
}

async function Stand() {
  if (Game["canStand"] || Game["canHit"]) {
    Game.changeState("waiting");
    standSound.play();
    let standsOn = YOU["score"] ? YOU["score"] : 11;

    await putCards(standsOn);

    computeWinner();
  }
}

async function putCards(standsOn) {
  while (DEALER["score"] <= standsOn && !Game["canDeal"]) {
    await sleep(1000);
    placeCard(randomCard(), DEALER);
  }
}

function Deal() {
  if (Game["canDeal"]) {
    dealSound.play();
    removeAllCards();
    resetScores();
    showResult("Let's Play!", "muted");
    Game.changeState("canHit");
  }
}

function placeCard(name, player) {
  $(player["div"]).appendChild(renderCard(name));
  changeScore(player, getScoreFromCard(name));

  placeCardSound.play();
}

function renderCard(name) {
  const cardImagen = document.createElement("img");
  cardImagen.src = `statics/images/${name}.png`;
  cardImagen.classList = "cardImagen";
  return cardImagen;
}

function changeScore(player, points) {
  if (points == 11 && player["score"] + points > 21) {
    points = 1;
  }

  player["score"] += points;

  if (player["score"] > 21) {
    playerBusted(player);
  } else {
    modifyScoreSpan(player);
  }
}

function modifyScoreSpan(player, busted = false) {
  const scoreSpan = $(player["scoreSpan"]);
  scoreSpan.textContent = busted ? "BUST!" : player["score"];
  scoreSpan.className = busted ? "text-danger" : "";
}

function getScoreFromCard(cardName) {
  let score = parseInt(cardName) ? parseInt(cardName) : parseScore(cardName);
  return score;
}

function parseScore(cardName) {
  return cardName === "A" ? 11 : 10;
}

function randomCard() {
  const randomIndex = Math.floor(Math.random() * 11);
  return deck[randomIndex];
}

function passTurn() {
  Game.changeState("canStand");
  Stand();
}

function playerBusted(player) {
  player["score"] = 0;

  modifyScoreSpan(player, true);

  player === YOU ? passTurn() : youWons();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function computeWinner() {
  if (whoHasHigherScore() === YOU) {
    youWons();
  } else if (whoHasHigherScore() === DEALER) {
    youLoses();
  } else {
    youDraws();
  }
}

function showResult(text, color) {
  const result = $("#blackjack-result");
  result.textContent = text;
  result.classList = [`text-${color}`];
}

function incrementCount(counterName) {
  Game[counterName]++;
  $(`#${counterName}Count`).textContent++;
  Game.changeState("canDeal");
}

function youLoses() {
  lossSound.play();
  showResult("You Lost!", "danger");
  incrementCount("losses");
}

function youWons() {
  if (!Game["canDeal"]) {
    winSound.play();
    showResult("You Win!", "success");
    incrementCount("wins");
  }
}

function youDraws() {
  showResult("You Drew!", "muted");
  incrementCount("draws");
}

function removeAllCards() {
  const cards = $(".cardImagen");
  for (const card of cards) {
    card.remove();
  }
}

function resetScores() {
  changeScore(YOU, -YOU["score"]);
  changeScore(DEALER, -DEALER["score"]);
}

function whoHasHigherScore() {
  let player = null;

  if (YOU["score"] !== DEALER["score"]) {
    player = YOU["score"] > DEALER["score"] ? YOU : DEALER;
  }

  return player;
}

/* For test purpuses. It checks what could happen when certain list of cards are placed by the player. */
async function testScore(cards = Array(), player = YOU) {
  for (const card of cards) {
    placeCard(card, player);
    await sleep(1000);
  }
}
