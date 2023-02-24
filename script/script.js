"use strict";

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");
const workout = document.querySelector(".workouts");
////////////////////////////////////////////////////////////////////////////

class Workout {
  date = new Date();
  id = Date.now().toString().slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords; // []
    this.distance = distance; // km
    this.duration = duration; // min
  }

  _descripeWorkout() {
    // prettier-ignore
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    this.descreption = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()} `;
  }
}

class Running extends Workout {
  type = "running";
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this._calcPace();
    this._descripeWorkout();
  }
  // min/km
  _calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = "cycling";
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this._calcSpeed();
    this._descripeWorkout();
  }
  // km / hr
  _calcSpeed() {
    this.speed = this.distance / this.duration / 60;
    console.log(this.speed);
    return this.speed;
  }
}

class App {
  #map;
  #mapEvent;
  #workouts = [];
  constructor() {
    this._getPosition();
    // this._getLocalStorage();
    this._getLocalStorage();
    // Handle Events
    form.addEventListener("submit", this._addWorkout.bind(this));
    inputType.addEventListener("change", this._toggleFields);
    workout.addEventListener("click", this._moveToMarker.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert(`Your browser doesn't support location API`);
        }
      );
    }
  }

  _loadMap(position) {
    // Get coordinates
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map("map").setView(coords, 13);

    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    L.marker(coords)
      .addTo(this.#map)

      .bindPopup(
        L.popup({
          maxWidth: 250,
          maxHeight: 50,
          keepInView: true,
          autoClose: false,
        })
      )
      .openPopup()
      .setPopupContent("Aswan");
    // Handle click on the map
    this.#map.on("click", this._showForm.bind(this));
    // Render workout on a map after map loading;
    this.#workouts.forEach((work) => this._renderWorkoutMarker(work));
  }

  _showForm(e) {
    form.classList.remove("hidden");
    inputDistance.focus();
    this.#mapEvent = e;
  }

  _toggleFields() {
    [inputCadence, inputElevation].forEach((input) =>
      input.closest(".form__row").classList.toggle("form__row--hidden")
    );
  }

  _resetForm() {
    [inputDistance, inputDuration, inputElevation, inputCadence].forEach(
      (input) => (input.value = "")
    );
    form.classList.add("hidden");
    form.style.display = "none";
    setTimeout(() => (form.style.display = "grid"), 500);
  }

  _addWorkout(e) {
    e.preventDefault();
    // valid Data
    const validData = (...inputs) =>
      inputs.every((input) => Number.isFinite(input));
    const allPositive = (...inputs) => inputs.every((input) => input > 0);
    // Get data from user
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const cadence = +inputCadence.value;
    let workout;
    const { lat, lng } = this.#mapEvent.latlng;
    const coords = [lat, lng];

    // check workout type
    if (type === "running") {
      const cadence = +inputCadence.value;
      if (
        !validData(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert(`Input must be positive numbers`);
      workout = new Running(coords, distance, duration, cadence);
    }
    if (type === "cycling") {
      const elevation = +inputElevation.value;
      if (
        !validData(distance, duration, cadence) ||
        !allPositive(distance, duration)
      )
        return alert(`Input must be positive numbers`);
      workout = new Cycling(coords, distance, duration, elevation);
    }
    // push workout in workouts array
    this.#workouts.push(workout);
    // Render workout as a marker
    this._renderWorkoutMarker(workout);
    // Render workout in a list
    this._renderWorkout(workout);
    // Resetting the form
    this._resetForm();
    // Set localStorage
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          maxHeight: 50,
          keepInView: true,
          autoClose: false,
          className: `${workout.type}-popup`,
        })
      )
      .openPopup()
      .setPopupContent(
        `${workout.type === "running" ? "🏃‍♂️" : "🚴‍♂️"} ${workout.descreption}`
      );
  }

  _renderWorkout(workout) {
    let html = `
   <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.descreption}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === "running" ? "🏃‍♂️" : "🚴‍♂️"
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>
    `;

    if (workout.type === "running") {
      html += `
        <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace.toFixed(2)}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">spm</span>
      </div>
    </li>
      `;
    }
    if (workout.type === "cycling") {
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(2)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div> 
      </li>
      `;
    }
    form.insertAdjacentHTML("afterend", html);
  }

  _moveToMarker(e) {
    const clicked = e.target.closest(".workout");
    if (!clicked) return;
    const id = clicked.dataset.id;
    const target = this.#workouts.find((work) => work.id === id);

    this.#map.setView(target.coords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    target.click();
  }

  _setLocalStorage() {
    // Set workout in local storage
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    // Get data from localstorage
    const data = localStorage.getItem("workouts");
    // Guard clause
    if (!data) return;
    // convet data from string to an object
    const workout = JSON.parse(data);
    this.#workouts = workout;
    this.#workouts.forEach((work) => {
      this._renderWorkout(work);
    });
  }
}

const app = new App();
