const cron = require("node-cron");
const https = require("https");
const nodemailer = require("nodemailer");

cron.schedule("* 8-23 * * *", () => {
  startRequest();
});

cron.schedule("0 */12 * * *", () => {
  sendEmail("keepAlive", "app is still running");
});

const sendEmail = (subject, body) => {
  const emailClient = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.emailUserName,
      pass: process.env.emailPassword,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const mailOptions = {
    from: process.env.emailFrom,
    to: process.env.emailTo,
    subject: subject,
    text: body,
  };

  emailClient.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};

const startRequest = () => {
  const reqData = {
    organization: "613f0d252587d979ae0aa702",
    type: "future_reservation",
    standby_reservation: false,
    seats_count: 2,
    preference: "inside",
    arriving_within: null,
    reserved_from: "2022-12-13T16:00:00.000Z",
    online_booking_source_client: {
      name: "tabit-web",
      environment: "il-prod-beta",
    },
  };

  const reqDataJSON = JSON.stringify(reqData);

  // const url = "https://tgm-apibeta.tabit.cloud/rsv/booking/temp-reservations";
  const reqOptions = {
    hostname: "tgm-apibeta.tabit.cloud",
    port: 443,
    path: "/rsv/booking/temp-reservations",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": reqDataJSON.length,
    },
    rejectUnauthorized: false,
  };

  const req = https.request(reqOptions, (res) => {
    console.log("statusCode:", res.statusCode);
    console.log("headers:", res.headers);
    res.setEncoding("utf8");
    let responseData = "";
    res.on("data", (d) => {
      responseData += d;
    });
    res.on("end", () => {
      // once data is completly fetched do JSON.parse();
      console.log("No more data in response.");
      const results = JSON.parse(responseData);
      console.log(results);
      const keys = Object.keys(results);
      if (keys.includes("reservation")) {
        console.log("reservation!");
        const emailText = "Reservation is available";
        sendEmail(emailText, emailText);
      } else if (keys.includes("alternative_results")) {
        console.log("alternative_results...");
      } else {
        console.log("error in response");
        const emailText = "Error in app";
        sendEmail(emailText, emailText);
      }
    });
  });

  req.on("error", (e) => {
    console.error(e);
  });

  req.write(reqDataJSON);
  req.end();
};
