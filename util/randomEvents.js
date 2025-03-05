function getRandomEvent() {
  const events = [
    "You enter a mysterious forest where the trees whisper secrets.",
    "The wind carries strange sounds as you approach a shadowy clearing.",
    "A gentle glow in the distance hints at hidden wonders.",
    "A sudden chill runs down your spine as fog envelops the path."
  ];
  return events[Math.floor(Math.random() * events.length)];
}

module.exports = getRandomEvent;