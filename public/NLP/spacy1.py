import spacy
from flask import Flask, request, jsonify
from collections import defaultdict

app = Flask(__name__)
# Load English tokenizer, tagger, parser and NER
nlp = spacy.load("en_core_web_sm")

# Process whole documents
@app.route('/nlp', methods=['POST'])
def extract_org():
    #data = request.json
    #text = data.get('text')
    # text = 'Thank you for applying to Databricks!'
    texts = ["Thank you for applying- 2024 Technology Intern at Internship Positions at Global Atlantic Financial Group",
        "Dear Vengatesh ,",
"Thanks for applying to Global Atlantic Financial Group. We are excited that you have considered us in your job search! To help you get to know Global Atlantic a little bit better, you can",
"Your application has been received for the 2024 Technology Intern position and we will review it as soon as possible. If your application meets the qualifications for the open role, one of our",
"Talent Acquisition Partners will reach out to you via email to start the interview process. Please keep an eye out for an email from us and keep in mind, it may go to spam.",
"If you are interested in other positions we may have available, you can visit www.globalatlantic.com/careers for our most up to date openings. Please feel free to share with your friends!",
"If you have any questions about where your application stands, or if you require an accommodation throughout this process, please reach out to recruiting@gafg.com. ",
"Thank you again for your application and we wish you all the best in your job search! ",
"Regards,"
"Global Atlantic",
"**Please note: Do not reply to this email. This email is sent from an unattended mailbox. Replies will not be read.**"
]
    entity_dict = defaultdict(int)
    for text in texts:
        doc = nlp(text)
        orgs = []
        for entity in doc.ents:
            if entity.label_ == "ORG":
                entity_dict[str(entity)]+=1
    
    print(entity_dict)
    # orgs.append(entity.text)
    # print(orgs)
    #return jsonify(orgs)

if __name__ == '__main__':
    # app.run(host='0.0.0.0', port=8000, debug=True)
    extract_org()