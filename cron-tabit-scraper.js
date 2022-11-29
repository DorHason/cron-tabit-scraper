const cron = require("node-cron");
const https = require("https");
const nodemailer = require("nodemailer");

const optionA = "2022-12-13T16:00:00.000Z";
const optionB = "2022-12-12T19:00:00.000Z";

cron.schedule("* 8-23 * * *", () => {
  startRequest(optionA);
});

cron.schedule("* 8-23 * * *", () => {
  startRequest(optionB);
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

const startRequest = (reservedFrom) => {
  const reqData = {
    organization: "613f0d252587d979ae0aa702",
    type: "future_reservation",
    standby_reservation: false,
    seats_count: 2,
    preference: "inside",
    arriving_within: null,
    reserved_from: reservedFrom,
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

  console.log(`Sending request for ${reservedFrom}`);

  const req = https.request(reqOptions, (res) => {
    console.log(
      `Received response for ${reservedFrom}. Status code: ${res.statusCode}`
    );
    res.setEncoding("utf8");
    let responseData = "";
    res.on("data", (d) => {
      responseData += d;
    });
    res.on("end", () => {
      // once data is completly fetched do JSON.parse();
      console.log("No more data in response.");
      const results = JSON.parse(responseData);
      const keys = Object.keys(results);
      if (keys.includes("reservation")) {
        console.log("***** reservation! *****");
        const emailText = "Reservation is available";
        sendEmail(emailText, emailText);
      } else if (keys.includes("alternative_results")) {
        console.log("alternative_results...");
        try {
          const alternativeResults = results["alternative_results"];
          alternativeResults.forEach((result) => {
            if (result["title_timestamp"].includes("2022-12-13")) {
              console.log("***** alternative reservation is available! *****");
              const emailText = "Reservation is available";
              sendEmail(emailText, result["title_timestamp"]);
            }
          });
        } catch (error) {
          console.log("******* error in parsing alternative results: *******");
          console.log(error);
          const emailText = "Error in parsing alternative results";
          sendEmail(emailText, emailText);
        }
      } else {
        console.log("******* error in response: *******");
        console.log(results);
        const emailText = "Error in app";
        sendEmail(emailText, emailText);
      }
    });
  });

  req.on("error", (e) => {
    console.log("******* Error in request: *******");
    console.error(e);
  });

  req.write(reqDataJSON);
  req.end();
};
