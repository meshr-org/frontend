# Test locally
npm start

curl localhost:8080/keepalive

curl --header "Content-Type: application/json"   --request POST   --data '{"data":{"v":"2","tid":"G-K8MQEWSD38","gtm":"2oe4f0","_p":"1992368660","sr":"1920x1080","ul":"sv-se","cid":"504172281.1582733768","dl":"https%3A%2F%2Frobertsahlin.com%2F","dr":"https%3A%2F%2Fwww.google.se%2F","dt":"robertsahlin.com","sid":"1587737451","sct":"2","seg":"1","_s":"1","en":"view_item_list","_et":"6","pr1":"nmTriblend%20Android%20T-Shirt~id12345~pr15.25~brGoogle~caApparel~k0item_category_2~v0Mens~k1item_category_3~v1Shirts~k2item_category_4~v2Tshirts~vaGray~lnSearch%20Results~liSR123~lp1~qt1","pr2":"nmDonut%20Friday%20Scented%20T-Shirt~id67890~pr33.75~brGoogle~caApparel~k0item_category_2~v0Mens~k1item_category_3~v1Shirts~k2item_category_4~v2Tshirts~vaBlack~lnSearch%20Results~liSR123~lp2~qt1"},"headers":{"user-agent":"curl/7.52.1","host":"localhost:8080"}, "attributes":{"namespace":"com.google.analytics.v2","name":"Hit","topic":"com.google.analytics.v2.Hit-collector"}}'   "http://localhost:8080/?backup=tmp"

  # Deploy Cloud Functions from shell
  gcloud functions deploy ga_proxy --region europe-west1 --runtime nodejs10 --trigger-http --allow-unauthenticated --max-instances 5 --set-env-vars MAIN_TOPIC=ga-proxy,ALLOW_ORIGIN=*