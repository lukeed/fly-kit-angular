import angular from 'angular';
import 'angular-component';
import {isOk, onSuccess, onError} from './sw';
import './app';

// Run the service worker if we determine it's safe to
// Note: this will Error during development because
// 'service-worker.js' only exists after production builds.
if (isOk) {
	navigator.serviceWorker.register('service-worker.js').then(onSuccess).catch(onError);
}

// Custom JS goes here!
document.addEventListener('DOMContentLoaded', () => {
	angular.bootstrap(document, ['app']);
});
