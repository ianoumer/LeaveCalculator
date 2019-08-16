import React, { Component } from "react";
import "./App.css";
import moment from "moment";

class App extends Component {
  constructor() {
    super();
    this.state = {
      userType: "",
      userStep: 1,
      empStatus: "",
      empShiftworker: "",
      empStartDate: "",
      empEndDate: "",
      empTotalWeeklyHours: "",
      empWeeklyHours: {
        sunday: 0,
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 0
      },
      empParentalLeave: {
        weeks: 0,
        hours: 0
      },
      empOtherLeave: {
        weeks: 0,
        hours: 0
      },
      empPaidLeave: {
        weeks: 0,
        hours: 0
      }
    };
  }

  getResultWorkHours = () => {
    let startDate = moment(this.state.empStartDate);
    let endDate = moment(this.state.empEndDate);
    let days = Object.values(this.state.empWeeklyHours);
    let isoWeekday = [];
    let totalHours = [];
    let totalHoursPerWeek = [];

    for (let x = 0; x < days.length; x++) {
      if (days[x] !== 0) {
        isoWeekday.push(x);
      }
    }

    for (let i = 0; i < isoWeekday.length; i++) {
      let daysToAdd = (7 + isoWeekday[i] - startDate.isoWeekday()) % 7;
      let nextWeek = startDate.clone().add(daysToAdd, "days");
      if (nextWeek.isAfter(endDate)) {
        return 0;
      }
      let weeksBetween = endDate.diff(nextWeek, "weeks") + 1;
      totalHours.push(weeksBetween * days[isoWeekday[i]]);
      totalHoursPerWeek.push(days[isoWeekday[i]]);
    }
    let sumTotalHoursPerWeek = totalHoursPerWeek.reduce((a, b) => a + b, 0);
    let sumTotalHours = totalHours.reduce((a, b) => a + b, 0);

    return [
      sumTotalHours,
      this.getResultlLeaves(
        sumTotalHoursPerWeek,
        this.state.empParentalLeave.weeks,
        this.state.empParentalLeave.hours
      ),
      this.getResultlLeaves(
        sumTotalHoursPerWeek,
        this.state.empOtherLeave.weeks,
        this.state.empOtherLeave.hours
      ),
      this.getResultlLeaves(
        sumTotalHoursPerWeek,
        this.state.empPaidLeave.weeks,
        this.state.empPaidLeave.hours
      ),
      this.getResultAccrualRate(this.state.empShiftworker),
      this.getResultAnnualLeave(sumTotalHours,sumTotalHoursPerWeek)
    ];
  };


  getResultAnnualLeave = (sumTotalHours, sumTotalHoursPerWeek) => {
    let parentalLeave = (sumTotalHoursPerWeek * this.state.empParentalLeave.weeks) + this.state.empParentalLeave.hour;
    let otherLeave = (sumTotalHoursPerWeek * this.state.empOtherLeave.weeks) + this.state.empOtherLeave.hour;
    let paidLeave = (sumTotalHoursPerWeek * this.state.empPaidLeave.weeks) + this.state.empPaidLeave.hour;
    let accrualRate = this.getResultAccrualRate(this.state.empShiftworker)
    console.log(parentalLeave)
    return ((sumTotalHours - otherLeave - parentalLeave)/accrualRate) - paidLeave

  }

  getResultlLeaves = (daysOnAWeek, weeks, hours) => {
    if (weeks > 0 || hours > 0) {
      return (daysOnAWeek * weeks) + hours;
    } else {
      return 0;
    }
  };

  getResultAccrualRate = answer => {
    return answer === "true" ? 10.428571 : 13.035714;
  };

  updateInput = e => {
    if (this.state.userStep > 3) {
      this.setState({ [e.target.name]: e.target.value });
    } else {
      this.setState({
        [e.target.name]: e.target.value,
        userStep: this.state.userStep + 1
      });
    }
  };

  getHours = e => {
    let currentTarget = { ...this.state[e.target.name] };
    currentTarget[e.target.title] = Number(e.target.value);
    this.setState({ [e.target.name]: currentTarget });
  };

  getWeekHours = e => {
    const { empWeeklyHours } = { ...this.state };
    let currentState = empWeeklyHours;
    let { name, value } = e.target;
    value < 0 ? (currentState[name] = 0) : (currentState[name] = Number(value));

    this.setState({ empWeeklyHours: currentState });
    this.sumWeekHours();
  };

  sumWeekHours = () => {
    let totalWeekHours =
      this.state.empWeeklyHours.monday +
      this.state.empWeeklyHours.tuesday +
      this.state.empWeeklyHours.wednesday +
      this.state.empWeeklyHours.thursday +
      this.state.empWeeklyHours.friday +
      this.state.empWeeklyHours.saturday +
      this.state.empWeeklyHours.sunday;
    this.setState({ empTotalWeeklyHours: totalWeekHours });
  };

  stepBack = e => {
    if (this.state.userStep === 4) {
      this.setState({
        empTotalWeeklyHours: "",
        empStartDate: "",
        empEndDate: "",
        empWeeklyHours: {
          sunday: 0,
          monday: 0,
          tuesday: 0,
          wednesday: 0,
          thursday: 0,
          friday: 0,
          saturday: 0
        },
        userStep: this.state.userStep - 1
      });
    } else if (this.state.userStep === 5) {
      this.setState({
        empParentalLeave: "",
        empOtherLeave: "",
        empPaidLeave: "",
        userStep: this.state.userStep - 1
      });
    } else {
      this.setState({
        [e.target.value]: "",
        userStep: this.state.userStep - 1
      });
    }
  };

  stepForward = () => {
    if (
      this.state.empTotalWeeklyHours &&
      this.state.empStartDate &&
      this.state.empEndDate &&
      this.state.userStep === 4
    ) {
      this.setState({ userStep: this.state.userStep + 1 });
    } else if (this.state.userStep === 5) {
      this.setState({
        userStep: this.state.userStep + 1,
        empTotalParentalLeave:
          Number(this.state.empParentalLeave.weeks) * 168 +
          Number(this.state.empParentalLeave.hours),
        empTotalPaidLeave:
          Number(this.state.empPaidLeave.weeks) * 168 +
          Number(this.state.empPaidLeave.hours),
        empTotalOtherLeave:
          Number(this.state.empOtherLeave.weeks) * 168 +
          Number(this.state.empOtherLeave.hours)
      });
    }
  };

  displayStep1 = () => {
    return (
      <div>
        <h2>Are you an employee or an employer?</h2>
        <div className="label__parent">
          <div className="label__child">
            <input
              id="employee"
              type="radio"
              name="userType"
              value="employee"
              defaultChecked={this.state.userType === "employee"}
              onClick={this.updateInput}
            />
            <label htmlFor="employee">I’m an employee</label>
          </div>
          <div className="label__child">
            <input
              id="employer"
              type="radio"
              name="userType"
              value="employer"
              defaultChecked={this.state.userType === "employer"}
              onClick={this.updateInput}
            />
            <label htmlFor="employer">I’m an employer</label>
          </div>
        </div>
      </div>
    );
  };

  displayStep2 = () => {
    return (
      <div>
        <h2>Select Employment Type:</h2>
        <hr className="d__none" />
        <div className="label__parent">
          <div className="label__child">
            <input
              id="fulltime"
              type="radio"
              name="empStatus"
              value="fulltime"
              defaultChecked={this.state.empStatus === "fulltime"}
              onClick={this.updateInput}
            />
            <label htmlFor="fulltime">Full Time</label>
          </div>
          <div className="label__child">
            <input
              id="parttime"
              type="radio"
              name="empStatus"
              value="parttime"
              defaultChecked={this.state.empStatus === "parttime"}
              onClick={this.updateInput}
            />
            <label htmlFor="parttime">Part Time</label>
          </div>
          <div className="label__child">
            <input
              id="casual"
              type="radio"
              name="empStatus"
              value="casual"
              defaultChecked={this.state.empStatus === "casual"}
              onClick={this.updateInput}
            />
            <label htmlFor="casual">Casual</label>
          </div>
        </div>
        <button
          className="solo__back"
          onClick={this.stepBack}
          value="empStatus"
        >
          Back
        </button>
      </div>
    );
  };

  displayStep3 = () => {
    return (
      <div>
        <h2>Are you a shift worker?</h2>
        <div className="label__parent">
          <div className="label__child">
            <input
              id="yes"
              type="radio"
              name="empShiftworker"
              value="true"
              defaultChecked={this.state.empShiftworker === "true"}
              onClick={this.updateInput}
            />
            <label htmlFor="yes">Yes</label>
          </div>
          <div className="label__child">
            <input
              id="no"
              type="radio"
              name="empShiftworker"
              value="false"
              defaultChecked={this.state.empShiftworker === "false"}
              onClick={this.updateInput}
            />
            <label htmlFor="no">No</label>
          </div>
        </div>
        <button
          className="solo__back"
          onClick={this.stepBack}
          value="empShiftworker"
        >
          Back
        </button>
      </div>
    );
  };

  displayStep4 = () => {
    return (
      <div className="step__four">
        <div className="step__row">
          <div className="step__col">
            <label htmlFor="startdate">Start date of work period</label>
            <input
              id="startdate"
              name="empStartDate"
              type="date"
              value={this.state.empStartDate}
              onChange={this.updateInput}
            />
          </div>
          <div className="step__col">
            <label htmlFor="enddate">End date of work period</label>
            <input
              id="enddate"
              name="empEndDate"
              type="date"
              value={this.state.empEndDate}
              onChange={this.updateInput}
            />
          </div>
        </div>
        <div className="part__two">
          <h2>Ordinary weekly hours</h2>
          <p>
            Annual leave accrues on your ordinary hours only. Overtime or unpaid
            breaks are not included.
          </p>

          <div className="step__row">
            <div className="step__col">
              <label htmlFor="sunday">Sunday</label>
            </div>
            <div className="step__col">
              <input
                id="sunday"
                name="sunday"
                type="number"
                placeholder="0"
                min="0"
                onChange={this.getWeekHours}
              />
            </div>
          </div>

          <div className="step__row">
            <div className="step__col">
              <label htmlFor="monday">Monday</label>
            </div>
            <div className="step__col">
              <input
                id="monday"
                name="monday"
                type="number"
                min="0"
                placeholder="0"
                onChange={this.getWeekHours}
              />
            </div>
          </div>

          <div className="step__row">
            <div className="step__col">
              <label htmlFor="tuesday">Tuesday</label>
            </div>
            <div className="step__col">
              <input
                id="tuesday"
                name="tuesday"
                type="number"
                placeholder="0"
                min="0"
                onChange={this.getWeekHours}
              />
            </div>
          </div>

          <div className="step__row">
            <div className="step__col">
              <label htmlFor="wednesday">Wednesday</label>
            </div>
            <div className="step__col">
              <input
                id="wednesday"
                name="wednesday"
                type="number"
                placeholder="0"
                min="0"
                onChange={this.getWeekHours}
              />
            </div>
          </div>

          <div className="step__row">
            <div className="step__col">
              <label htmlFor="thursday">Thursday</label>
            </div>
            <div className="step__col">
              <input
                id="thursday"
                name="thursday"
                type="number"
                placeholder="0"
                min="0"
                onChange={this.getWeekHours}
              />
            </div>
          </div>

          <div className="step__row">
            <div className="step__col">
              <label htmlFor="friday">Friday</label>
            </div>
            <div className="step__col">
              <input
                id="friday"
                name="friday"
                type="number"
                placeholder="0"
                min="0"
                onChange={this.getWeekHours}
              />
            </div>
          </div>

          <div className="step__row">
            <div className="step__col">
              <label htmlFor="saturday">Saturday</label>
            </div>
            <div className="step__col">
              <input
                id="saturday"
                name="saturday"
                type="number"
                placeholder="0"
                min="0"
                onChange={this.getWeekHours}
              />
            </div>
          </div>
        </div>
        <div className="duo">
          <button className="duo__back" onClick={this.stepBack}>
            Back
          </button>
          <button className="duo__next" onClick={this.stepForward}>
            Next
          </button>
        </div>
      </div>
    );
  };

  displayStep5 = () => {
    return (
      <div>
        <div className="step__five">
          <h2>Unpaid Parental Leave Taken</h2>
          <div className="row">
            <div className="col-sm-6">
              <label htmlFor="weeks1">Weeks</label>
              <input
                title="weeks"
                id="weeks1"
                name="empParentalLeave"
                type="number"
                min="0"
                placeholder="0"
                onChange={this.getHours}
              />
            </div>
            <div className="col-sm-6">
              <label htmlFor="hours1">Hours</label>
              <input
                title="hours"
                id="hours1"
                name="empParentalLeave"
                type="number"
                min="0"
                placeholder="0"
                onChange={this.getHours}
              />
            </div>
          </div>
        </div>
        <div className="step__five">
          <h2>Other Unpaid Leave Taken</h2>
          <div className="row">
            <div className="col-sm-6">
              <label htmlFor="weeks2">Weeks</label>
              <input
                title="weeks"
                id="weeks2"
                name="empOtherLeave"
                type="number"
                min="0"
                placeholder="0"
                onChange={this.getHours}
              />
            </div>
            <div className="col-sm-6">
              <label htmlFor="hours2">Hours</label>
              <input
                title="hours"
                id="hours2"
                name="empOtherLeave"
                type="number"
                min="0"
                placeholder="0"
                onChange={this.getHours}
              />
            </div>
          </div>
        </div>
        <div className="step__five">
          <h2>Paid Annual Leave Taken</h2>
          <div className="row">
            <div className="col-sm-6">
              <label htmlFor="weeks3">Weeks</label>
              <input
                title="weeks"
                id="weeks3"
                name="empPaidLeave"
                type="number"
                min="0"
                placeholder="0"
                onChange={this.getHours}
              />
            </div>
            <div className="col-sm-6">
              <label htmlFor="hours3">Hours</label>
              <input
                title="hours"
                id="hours3"
                name="empPaidLeave"
                type="number"
                min="0"
                placeholder="0"
                onChange={this.getHours}
              />
            </div>
          </div>
        </div>
        <div className="duo">
          <button className="duo__back" onClick={this.stepBack}>
            Back
          </button>
          <button className="duo__next" onClick={this.stepForward}>
            Next
          </button>
        </div>
      </div>
    );
  };

  displayResult = () => {
    return (
      <div className="result">
        <ul>
          <li>
            <h2>Annual leave balance:</h2>
            <h2>{this.getResultWorkHours()[5]}</h2>
          </li>
        </ul>
        <h3>
          Work Period: {moment(this.state.empStartDate).format("MMM D, YYYY")}{" "}
          to {moment(this.state.empEndDate).format("MMM D, YYYY")}
        </h3>
        <ul>
          <li>
            <p>Total hours in the work period:</p>
            <p>{this.getResultWorkHours()[0]}</p>
          </li>
          <li>
            <p>
              Total hours of leave taken under the Paid Parental Leave Scheme in
              the period:
            </p>
            <p>{this.getResultWorkHours()[1]}</p>
          </li>
          <li>
            <p>Total hours of unpaid leave taken in the period:</p>
            <p>{this.getResultWorkHours()[2]}</p>
          </li>
          <li>
            <p>Annual leave accrual rate:</p>
            <p>{this.getResultWorkHours()[4]}</p>
          </li>
          <li>
            <p>Total hours of annual leave taken during the period:</p>
            <p>{this.getResultWorkHours()[3]}</p>
          </li>
        </ul>
      </div>
    );
  };

  displaySteps = () => {
    if (this.state.userStep === 1) {
      return this.displayStep1();
    } else if (this.state.userStep === 2) {
      return this.displayStep2();
    } else if (this.state.userStep === 3) {
      return this.displayStep3();
    } else if (this.state.userStep === 4) {
      return this.displayStep4();
    } else if (this.state.userStep === 5) {
      return this.displayStep5();
    } else if (this.state.userStep === 6) {
      return this.displayResult();
    }
  };

  render() {
    return <div className="leave__cal container">{this.displaySteps()}</div>;
  }
}

export default App;
