/*
-------------------------------------------------------------------------------------------------------------
written by Taylor Adams 
pull requested on July 8th 2026 
-------------------------------------------------------------------------------------------------------------
purpose: create a non-invasive approach to auth-script.js.

the auth-script.js has a flaw: it assumes that the page will have the EXACT id's and the EXACT input id's

the validation.js approach is to work with any form that has the action attribute containing 
"reserve.php" and will validate the username and email fields without relying on specific id's.


for example, view this line in the auth-script.js file:
function switchForm(formType) {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
 
this code above from auth-script.js assumes that the page will have the EXACT id's and the EXACT input id's.
 if the page does not have these exact id's, then the auth-script.js will not work.


-------------------------------------------------------------------------------------------------------------
  integration:
 
 it should be attached to a form with an action attribute containing "reserve.php".
 Ensure js/validation.js is correctly linked at the bottom of the page (before the closing tag).
Use DOMContentLoaded to ensure the script executes only after the DOM is fully loaded.
-------------------------------------------------------------------------------------------------------------

 */

document.addEventListener("DOMContentLoaded", function () {
  //recall: DOMContentLoaded event is fired when the HTML document has been loaded and parsed,
  // without waiting for stylesheets, images etc to finish loading. ensuring that the form elements are available.
  const form = document.querySelector('form[action*="reserve.php"]');
  // regex to find the form element with an action attribute containing reserve.php
  //the above also accomodates the case where the form action is something like "reserve.php?param=value" or "reserve.php#anchor" or "reserve.php/some/path".

  if (form) {
    form.addEventListener("submit", function (event) {
      // Get the username and email fields
      const username = document.querySelector('input[name="username"]');
      const email = document.querySelector('input[name="user_email"]');

      let isValid = true;



      // Check if username or password are empty


      if (!username || username.value.trim() === "") {
        alert("Please enter your username");
        isValid = false;
      }

      
      if (!email || email.value.trim() === "") {
        alert("Please enter your email");
        isValid = false;
      }

      // Check if email format is valid

      //REGEX adapted from: https://stackoverflow.com/questions/46155/how-can-i-validate-an-email-address-in-javascript
      // Source - https://stackoverflow.com/a/46181
      // Posted by John Rutherford, modified by community. See post 'Timeline' for change history
      // Retrieved 2026-07-05, License - CC BY-SA 4.0

      //this regex is a bit stricter with the formatting. for example, the auth-script.js regex  would accept invalid emails like "user@domain" or "user@domain..com" or "user@domain.c" or "user@domain.123" or "user@domain.-com"" whereas the regex below would not accept those.
      const emailRegex =
        /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      if (email && email.value.trim() !== "" && !emailRegex.test(email.value)) {
        alert("Please enter a valid email address");
        isValid = false;
      }

      // If validation failed, stop the form submission
      if (!isValid) {
        event.preventDefault();
      }
    });
  }
});
