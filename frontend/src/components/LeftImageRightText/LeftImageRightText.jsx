import React from "react";
import styles from "./LeftImageRightText.module.css";
import { Submit } from "../Submit/Submit";

function LeftImageRightText() {
  return (
    <>
      <div className={styles.main1}>
        <div className={styles.left}>
          <p className={styles.heading}> 
            Discover your dream <span>startup</span>
          </p>
          <div className={styles.subheaddiv}>
            <p className={styles.subheading}>
              Join 500k+ entrepreneurs closing life-changing deals. Buy and sell
              SaaS, ecommerce, agencies,.
            </p>
            <Submit btn1text={"View Listings"}/>
          </div>
        </div>

        <div className={styles.right}>
          {/* <img src="./sapiencycle.png" alt="" /> */}
         <video src="/bs.mp4" autoPlay muted loop playsInline />

        </div>
      </div>
    </>
  );
}

export { LeftImageRightText };
