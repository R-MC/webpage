// Created with OpenAI Codex assistance, 20 October 2026.
const form = document.getElementById('fish-form');
const result = document.getElementById('fish-result');

form.addEventListener('submit', function (event) {
  event.preventDefault();

  const fish = document.getElementById('fish-name').value;
  const length = Number(document.getElementById('fish-length').value);

  result.textContent = 'Your ' + fish + ' is ' + length + ' cm long.';

  if (length >= 50) {
    result.textContent += ' That is a big fish!';
  } else {
    result.textContent += ' Thanks for recording your fish!';
  }
});
