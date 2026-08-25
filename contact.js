(function () {
  const form = document.getElementById("contact-form");
  const status = document.getElementById("contact-form-status");
  const success = document.getElementById("contact-success");
  const sendAnother = document.getElementById("contact-send-another");

  if (!form || !status || !success) return;

  const submitButton = form.querySelector("button[type='submit']");
  const submitLabel = form.querySelector(".contact-submit-label");
  const defaultSubmitLabel = submitLabel ? submitLabel.textContent : "内容を送信する";

  function setStatus(message, state) {
    status.textContent = message;
    status.dataset.state = state || "error";
    status.hidden = false;
  }

  function clearStatus() {
    status.hidden = true;
    status.textContent = "";
    status.removeAttribute("data-state");
  }

  function markInvalidFields() {
    form.querySelectorAll("input, select, textarea").forEach(function (field) {
      if (!field.checkValidity()) {
        field.setAttribute("aria-invalid", "true");
      } else {
        field.removeAttribute("aria-invalid");
      }
    });
  }

  form.addEventListener("input", function (event) {
    const field = event.target;
    if (field.matches("input, select, textarea") && field.checkValidity()) {
      field.removeAttribute("aria-invalid");
    }
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    clearStatus();

    if (!form.checkValidity()) {
      markInvalidFields();
      setStatus("未入力または形式の違う項目があります。「必須」の欄をご確認ください。", "error");
      form.reportValidity();
      return;
    }

    submitButton.disabled = true;
    if (submitLabel) submitLabel.textContent = "送信しています…";
    setStatus("お問い合わせを送信しています。画面を閉じずにお待ちください。", "sending");

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { "Accept": "application/json" }
      });

      if (response.ok) {
        form.reset();
        form.querySelectorAll("[aria-invalid='true']").forEach(function (field) {
          field.removeAttribute("aria-invalid");
        });
        clearStatus();
        form.hidden = true;
        success.hidden = false;
        success.focus();
        return;
      }

      if (response.status === 429) {
        setStatus("短時間に送信が集中しています。少し時間を置いて、もう一度お試しください。", "error");
      } else {
        let message = "送信できませんでした。入力内容をご確認のうえ、もう一度お試しください。";
        try {
          const result = await response.json();
          if (result && Array.isArray(result.errors) && result.errors.length) {
            message = "送信できませんでした。返信先メールアドレスなどの入力内容をご確認ください。";
          }
        } catch (error) {
          // JSON以外の応答だった場合は、共通メッセージを表示します。
        }
        setStatus(message, "error");
      }
    } catch (error) {
      setStatus("通信できませんでした。インターネット接続をご確認のうえ、もう一度お試しください。", "error");
    } finally {
      submitButton.disabled = false;
      if (submitLabel) submitLabel.textContent = defaultSubmitLabel;
    }
  });

  if (sendAnother) {
    sendAnother.addEventListener("click", function () {
      success.hidden = true;
      form.hidden = false;
      clearStatus();
      const firstField = form.querySelector("input:not([type='hidden'])");
      if (firstField) firstField.focus();
    });
  }
})();
