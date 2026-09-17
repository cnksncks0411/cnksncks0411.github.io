(function () {
  const sendModes = document.querySelectorAll('[data-sms-send-mode]');
  const scheduleFields = document.querySelectorAll('[data-sms-schedule]');
  const scheduleDateWrap = document.querySelector('#smsReservationDate')?.closest('[data-datepicker-wrap]');

  const updateScheduleState = () => {
    const isReservation = document.querySelector('[data-sms-send-mode][value="reservation"]')?.checked;

    scheduleFields.forEach((field) => {
      field.disabled = !isReservation;
    });

    scheduleDateWrap?.querySelectorAll('[data-datepicker-toggle]').forEach((button) => {
      button.disabled = !isReservation;
    });

    if (isReservation && scheduleDateWrap && !scheduleDateWrap._adminDatepicker) {
      scheduleDateWrap.removeAttribute('data-datepicker-bound');
      window.initAdminForm?.();
    }
  };

  sendModes.forEach((mode) => mode.addEventListener('change', updateScheduleState));

  updateScheduleState();
})();
