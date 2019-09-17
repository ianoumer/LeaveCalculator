import React, { Component } from "react";
import "./App.css";
import moment from "moment";

class App extends Component {
  constructor() {
    super();
    this.state = {
      userType: "",
      userStep: 1,
      buttonNext: true,
      empStatus: "",
      empShiftworker: "",
      empStartDate: "",
      empEndDate: moment().format('YYYY-MM-DD'),
      empTotalWeeklyHours: 0,
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
      this.getResultAnnualLeave(sumTotalHours, sumTotalHoursPerWeek)
    ];
  };

  getResultAnnualLeave = (sumTotalHours, sumTotalHoursPerWeek) => {
    let parentalLeave =
      sumTotalHoursPerWeek * this.state.empParentalLeave.weeks +
      this.state.empParentalLeave.hours;
    let otherLeave =
      sumTotalHoursPerWeek * this.state.empOtherLeave.weeks +
      this.state.empOtherLeave.hours;
    let paidLeave =
      sumTotalHoursPerWeek * this.state.empPaidLeave.weeks +
      this.state.empPaidLeave.hours;
    let accrualRate = this.getResultAccrualRate(this.state.empShiftworker);
    let formattedDate = moment.duration(
      (sumTotalHours - otherLeave - parentalLeave) / accrualRate - paidLeave,
      "hours"
    );
    let formattedHours = Math.floor(
      (sumTotalHours - otherLeave - parentalLeave) / accrualRate - paidLeave);

    let totalHours = formattedHours;
    let totalMinutes = formattedDate._data.minutes;
    return (
      totalHours +
      (totalHours === 1 ? " hour" : " hours") +
      "  and " +
      totalMinutes +
      (totalMinutes === 1 ? " minute" : " minutes")
    );
  };

  getResultlLeaves = (daysOnAWeek, weeks, hours) => {
    if (weeks > 0 || hours > 0) {
      return daysOnAWeek * weeks + hours;
    } else {
      return 0;
    }
  };

  getResultAccrualRate = answer => {
    return answer === "true" ? 10.428571 : 13.035714;
  };

  validation = (totalHours, startDate, endDate) => {
    if (
      totalHours <= 38 &&
      totalHours !== 0 &&
      moment(endDate).isAfter(startDate)
    ) {
      this.setState({ buttonNext: false });
    } else {
      this.setState({ buttonNext: true });
    }
  };

  errorNotes = () => {
    if (moment(this.state.empStartDate).isAfter(moment(this.state.empEndDate))) {
      return "The end date specified must be after the start date.";
    } else if (this.state.empTotalWeeklyHours > 38) {
      return "The number of hours specified must be less than or equal to 38";
    } else {
      return "";
    }
  };

  updateInput = e => {
    if (this.state.userStep > 3) {
      this.setState({ [e.target.name]: e.target.value });
      var newStartDate = e.target.name === 'empStartDate' ? e.target.value : this.state.empStartDate;
      var newEndDate = e.target.name === 'empEndDate' ? e.target.value : this.state.empEndDate;
      this.validation(
        this.state.empTotalWeeklyHours,
        newStartDate,
        newEndDate
      );
    } else {
      if (e.target.value === "casual"){
        this.setState({
          [e.target.name]: e.target.value,
          userStep: this.state.userStep + 5,
        });
      } else {
        this.setState({
          [e.target.name]: e.target.value,
          userStep: this.state.userStep + 1
        });
      }
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
    this.validation(
      totalWeekHours,
      this.state.empStartDate,
      this.state.empEndDate
    );
  };

  reset = () => {
    this.setState({
        userType: "",
        userStep: 1,
        buttonNext: true,
        empStatus: "",
        empShiftworker: "",
        empStartDate: "",
        empEndDate: moment().format('YYYY-MM-DD'),
        empTotalWeeklyHours: 0,
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
  
    })
  }

  stepBack = e => {
    if (this.state.userStep === 4) {
      this.setState({
        empTotalWeeklyHours: 0,
        empStartDate: "",
        empEndDate: moment().format('YYYY-MM-DD'),
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
        },
        userStep: this.state.userStep - 1
      });
    } else {
      if(this.state.empStatus === 'casual'){
        this.setState({
          empStatus: "",
          userStep: this.state.userStep - 5
        });
      } else {
        this.setState({
          [e.target.name]: "",
          userStep: this.state.userStep - 1
        });
      }
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
        {this.progress()}
      </div>
    );
  };

  displayStep2 = () => {
    return (
      <div>
        <h2>Select Employment Type:
        <a href="#note" 
            data-tooltip
            data-tooltip-message="The type of employment determines your pay rate, leave, and other entitlements.">
            <span className="glyphicon glyphicon-question-sign" aria-hidden="true"></span>
          </a>
        </h2>
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
        {this.progress()}
      </div>
    );
  };

  displayStep3 = () => {
    return (
      <div>
        <h2>Are you a shift worker? 
          <a href="#note" 
            data-tooltip
            data-tooltip-message="Under the NES, a shift worker is someone who works for a business that requires to be rostered 24/7 (regularly for those shifts), and works on Sundays and Public Holidays.">
            <span className="glyphicon glyphicon-question-sign" aria-hidden="true"></span>
          </a>
        </h2>
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
        {this.progress()}
      </div>
    );
  };

  displayStep4 = () => {
    return (
      <div className="step__four">
        <div className="step__row">
          <div className="step__col">
            <label htmlFor="startdate">Start date of work period</label>
            <a href="#note" 
              data-tooltip
              data-tooltip-message="The start date of work that you want leave entitlement calculations to be applied. This will assume that your employment type will apply for the entire period.">
                <span className="glyphicon glyphicon-question-sign" aria-hidden="true"></span>
              </a>
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
            <a href="#note" 
              data-tooltip
              data-tooltip-message="The end date of work that you want leave entitlement calculations to be applied. This will assume that your employment type will apply for the entire period.">
                <span className="glyphicon glyphicon-question-sign" aria-hidden="true"></span>
              </a>
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
                defaultValue={this.state.empWeeklyHours.sunday}
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
                defaultValue={this.state.empWeeklyHours.monday}
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
                defaultValue={this.state.empWeeklyHours.tuesday}
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
                defaultValue={this.state.empWeeklyHours.wednesday}
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
                defaultValue={this.state.empWeeklyHours.thursday}
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
                defaultValue={this.state.empWeeklyHours.friday}
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
                defaultValue={this.state.empWeeklyHours.saturday}
                onChange={this.getWeekHours}
              />
            </div>
          </div>
        </div>
        <span>{this.errorNotes()}</span>
        <div className="duo">
          <button className="duo__back" onClick={this.stepBack}>
            Back
          </button>
          <button
            disabled={this.state.buttonNext}
            className="duo__next"
            onClick={this.stepForward}
          >
            Next
          </button>
        </div>
        {this.progress()}
      </div>
    );
  };

  displayStep5 = () => {
    return (
      <div>
        <div className="step__five">
          <h2>Unpaid Parental Leave Taken
          <a href="#note" 
            data-tooltip
            data-tooltip-message="Note that the Australian Government’s Paid Parental Leave Scheme is not considered to be paid leave.">
            <span className="glyphicon glyphicon-question-sign" aria-hidden="true"></span>
          </a>
          </h2>
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
                defaultValue={this.state.empParentalLeave.weeks}
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
                defaultValue={this.state.empParentalLeave.hours}
                onChange={this.getHours}
              />
            </div>
          </div>
        </div>
        <div className="step__five">
          <h2>Other Unpaid Leave Taken
          <a href="#note" 
            data-tooltip
            data-tooltip-message="Annual leave and sick/carer’s leave do not accumulate when an employee is on unpaid leave.">
            <span className="glyphicon glyphicon-question-sign" aria-hidden="true"></span>
          </a>
          </h2>
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
                defaultValue={this.state.empOtherLeave.weeks}
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
                defaultValue={this.state.empOtherLeave.hours}
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
                defaultValue={this.state.empPaidLeave.weeks}
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
                defaultValue={this.state.empPaidLeave.hours}
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
        {this.progress()}
      </div>
    );
  };

  displayResult = () => {
    return (
      <div className="result">
        <ul>
          <li>
            <h2>Leave balance:</h2>
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
        <div className="duo">
          <button className="duo__back" onClick={this.stepBack}>
            Back
          </button>
          <button className="duo__reset" onClick={this.reset}>
            Calculate Again
          </button>
          <small>Disclaimer: All calculations and results are based on the Fair Work’s National Employment Standards (NES) and 
            not based on a specific award. To calculate leave entitlements based on a specific award and/or 
            find out more about leave entitlements, visit FWO’s 
            <a href="https://calculate.fairwork.gov.au/Leave" target="_blank" rel="noopener noreferrer"> website</a>.</small>
        </div>
      </div>
    );
  };

  displayCasualResult = () => {
    return (
      <div className="casual">
      <h2>Casual Employees</h2>
      <p>According to the NES, casual employees are not entitled for annual leave.</p>
      <div className="duo">
        <button className="duo__back" onClick={this.stepBack}>
          Back
        </button>
      </div>
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
    } else if (this.state.userStep === 7) {
      // Display Casual Result
      return this.displayCasualResult();
    }
  };


  progress = () => {
    return (
      <div className="progress__bullet">
        <span className={this.state.userStep >= 1 ? "filled" : ""}></span>
        <span className={this.state.userStep >= 2 ? "filled" : ""}></span>
        <span className={this.state.userStep >= 3 ? "filled" : ""}></span>
        <span className={this.state.userStep >= 4 ? "filled" : ""}></span>
        <span className={this.state.userStep >= 5 ? "filled" : ""}></span>
        <span className={this.state.userStep >= 5 ? "filled" : ""}></span>
      </div>
    )
  }

  render() {
    return <div className="leave__cal container">{this.displaySteps()}</div>;
  }
}

export default App;
