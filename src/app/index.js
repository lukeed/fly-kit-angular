import router from 'angular-ui-router';
import Components from './components';
import Common from './common';

angular.module('app', [
	router,
	Common.name,
	Components.name,
	'app.templates'
]).component('app', {
	restrict: 'E',
	templateUrl: 'app.html'
});
