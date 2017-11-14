import { Week } from '../shared/week.model';
import { Year } from '../shared/year.model';
import { Period } from '../shared/period.model';
import { User } from '../shared/user.model';
import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { FirebaseListObservable, AngularFireDatabase } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';
import { ProgressService } from '../services/progress.service'
import * as firebase from 'firebase/app';
declare var $: any;
// import { NgModule } from '@angular/core';

const now = new Date();

@Component({
  selector: 'app-weekly-list',
  templateUrl: './weekly-list.component.html',
  styleUrls: ['./weekly-list.component.css'],

})

// @NgModule({
//   imports:[NgbModule]
// })

export class WeeklyListComponent implements OnInit {

  date: { year: number, month: number };
  rangeDateStart;
  rangeDateEnd = "";
  rangeColor;
  rangeNivel;
  currentPeriodLevel = 4;
  periods: Period[] = [];
  years: Year[] = [];


  periodList: FirebaseListObservable<Period[]>;

  @Input('firebaseUser') user: firebase.User;
  @Input() userDatabase: User;


  constructor(public db: AngularFireDatabase, private progressService: ProgressService) { }

  ngOnInit() {
    this.buildWeeks();
    this.getPeriodsData();

  }


  ngAfterViewInit() {
    $('[data-toggle="datepicker"]').datepicker();
    ($('.currentWeek')[0]).scrollIntoView('100');
    var offset = ($('.currentWeek')).offset();
    offset.top -= 100;
    $('html, body').animate({
      scrollTop: offset.top,
    }, 1000);

  }
  updatePeriods() {
    this.years.forEach((year) => {
      year.weeks.forEach((week) => {
        week.period = null;
      });
    });
    this.periods.sort((period) => period.dateToLong).forEach((period) => {
      if (period.level == this.currentPeriodLevel) {
        this.years.forEach((year) => {

          year.weeks.forEach((week) => {
            if (period.dateFromLong <= week.dateTo.getTime() && period.dateToLong >= week.dateFrom.getTime()) {
              week.period = period;
            }
          });
        });
      }
    });
  }
  formatDate(date: Date) {
    var day = date.getDate();
    var month = date.getMonth();
    month++;
    var year = date.getFullYear();

    return (day > 9 ? day : "0" + day) + '/' + (month > 9 ? month : "0" + month) + '/' + year;
  }

  updatePeriodFilter(level: number) {
    this.currentPeriodLevel = level;
    this.progressService.showProgress();
    this.updatePeriods();
    this.progressService.hideProgress();
  }

  buildWeeks() {
    var dateBegin = new Date(this.userDatabase.yearBirth, this.userDatabase.monthBirth, this.userDatabase.dayBirth);
    var dateEnd = new Date(this.userDatabase.yearBirth + this.userDatabase.ageOfDeath, this.userDatabase.monthBirth, this.userDatabase.dayBirth);
    this.years = [];
    var indexYear = 0;

    // while(dateBegin < dateEnd){
    for (var i = 0; i <= this.userDatabase.ageOfDeath; i++) {
      var dateFinalYear = new Date(this.userDatabase.yearBirth + (i + 1), this.userDatabase.monthBirth, this.userDatabase.dayBirth);
      var dateInitialYear = new Date(this.userDatabase.yearBirth + i, this.userDatabase.monthBirth, this.userDatabase.dayBirth);
      var weeks: Week[] = [];
      var indexWeek = 1;

      while (dateInitialYear < dateFinalYear) {

        dateInitialYear.setDate(dateInitialYear.getDate() + 1);
        if (dateInitialYear >= dateFinalYear) {
          break;
        }
        dateInitialYear.setDate(dateInitialYear.getDate() - 1);

        var currentDate = new Date();
        currentDate.setHours(0);
        currentDate.setMinutes(0);
        currentDate.setSeconds(0);
        currentDate.setMilliseconds(0);


        var dateLimit = new Date(dateInitialYear.getFullYear(), dateInitialYear.getMonth(), dateInitialYear.getDate() + 7, 0, 0, 0, 0);

        var dayRange = dateInitialYear.getDate() < this.userDatabase.dayBirth
          && dateInitialYear.getMonth() == this.userDatabase.monthBirth
          && (dateInitialYear.getDate() + 9) == this.userDatabase.dayBirth ?
          8 : 7;
        if (dayRange == 8) {
          dateLimit.setDate(dateLimit.getDate() + 1);
        }
        var isCurrentWeek = dateInitialYear <= currentDate && dateLimit > currentDate;
        var dateFrom = new Date(dateInitialYear.getTime());
        var dateTo = new Date(dateLimit.getTime());

        weeks.push({ dateFrom: dateFrom, dateTo: dateTo, dateFromSt: this.formatDate(dateFrom), dateToSt: this.formatDate(dateTo), periodColor: "", index: indexWeek, isCurrentWeek: isCurrentWeek, period: null });

        dateInitialYear.setDate(dateInitialYear.getDate() + dayRange);

        indexWeek++;
      }


      this.years.push({ date: dateBegin, index: indexYear < 10 ? "0" + indexYear : indexYear.toString(), weeks: weeks, isTheCurrentYear: dateBegin.getFullYear() == (new Date().getFullYear() - 2) });
      indexYear++;

    }
  }

  getPeriodsData() {
    this.periodList = this.db.list('periods_user_' + this.user.uid + "/");

    this.periodList.forEach((item) => {

      this.periods = [];

      item.forEach((period) => {
        this.periods.push(period)
      });

      this.progressService.showProgress();

      this.updatePeriods();

      this.progressService.hideProgress();
    });
  }


  setValue(key, value) {
    this[key] = value;
  }

  createRange() {

    console.log(this.rangeDateEnd);
    this.rangeDateStart = null;
    this.rangeDateEnd = null;
    this.rangeColor = null;
    this.rangeNivel = null;
  }

}
