/**
 * All-India city list, bundled with the app.
 *
 * The `locations` table on the production backend holds 31 rows across ten
 * states — it was seeded by hand as the marketplace launched city by city, so
 * whole states (Jharkhand among them) had no entry at all and could not be
 * picked in the city selector. Vendors, however, already carry a free-text
 * `location`, so a couple in Ranchi had listings to find and no way to say so.
 *
 * This file is the floor: every state and union territory, with the district
 * headquarters and the towns that actually run a wedding market. It is UNIONED
 * with the live table by `listLocations()` — the database always wins on
 * spelling, so the admin can keep curating there without fighting this file.
 *
 * Kept as data, not code: `supabase/seed-locations.sql` is generated from it so
 * the same list can be pushed into the table for the website to share.
 *
 * Loaded via dynamic import from the city selector only — Home never pays for it.
 */
export const INDIA_LOCATIONS: Record<string, string[]> = {
  'Andhra Pradesh': [
    'Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Rajahmundry', 'Kakinada',
    'Tirupati', 'Anantapur', 'Kadapa', 'Vizianagaram', 'Eluru', 'Ongole', 'Nandyal', 'Amaravati',
    'Machilipatnam', 'Adoni', 'Tenali', 'Proddatur', 'Chittoor', 'Hindupur', 'Srikakulam',
    'Bhimavaram', 'Madanapalle', 'Guntakal', 'Dharmavaram', 'Gudivada', 'Narasaraopet',
    'Tadepalligudem', 'Srikalahasti',
  ],
  'Arunachal Pradesh': [
    'Itanagar', 'Naharlagun', 'Pasighat', 'Tawang', 'Ziro', 'Bomdila', 'Aalo', 'Tezu', 'Roing',
    'Namsai', 'Changlang', 'Khonsa', 'Daporijo', 'Seppa', 'Yingkiong',
  ],
  Assam: [
    'Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur', 'Bongaigaon',
    'Dhubri', 'Diphu', 'Golaghat', 'Sivasagar', 'Karimganj', 'Goalpara', 'Barpeta',
    'North Lakhimpur', 'Mangaldoi', 'Hailakandi', 'Nalbari', 'Haflong', 'Kokrajhar', 'Duliajan',
  ],
  Bihar: [
    'Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga', 'Purnia', 'Ara', 'Begusarai',
    'Katihar', 'Munger', 'Chapra', 'Danapur', 'Bettiah', 'Saharsa', 'Sasaram', 'Hajipur',
    'Dehri', 'Siwan', 'Motihari', 'Nawada', 'Bagaha', 'Buxar', 'Kishanganj', 'Sitamarhi',
    'Jamalpur', 'Jehanabad', 'Aurangabad', 'Lakhisarai', 'Madhubani', 'Samastipur', 'Supaul',
    'Araria', 'Banka', 'Bhabua', 'Gopalganj', 'Khagaria', 'Madhepura', 'Bihar Sharif',
    'Sheikhpura', 'Sheohar', 'Arwal', 'Jamui', 'Bihta', 'Sonpur', 'Barh', 'Masaurhi',
    'Rajgir', 'Nalanda', 'Forbesganj', 'Mokama',
  ],
  Chhattisgarh: [
    'Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Rajnandgaon', 'Raigarh', 'Jagdalpur',
    'Ambikapur', 'Dhamtari', 'Mahasamund', 'Chirmiri', 'Janjgir', 'Kanker', 'Kawardha',
    'Bemetara', 'Balod', 'Baikunthpur', 'Sukma', 'Dantewada', 'Naya Raipur',
  ],
  Delhi: [
    'New Delhi', 'Dwarka', 'Rohini', 'Saket', 'Karol Bagh', 'Pitampura', 'Janakpuri',
    'Vasant Kunj', 'Chattarpur', 'Mayur Vihar', 'Rajouri Garden', 'Paschim Vihar', 'Shahdara',
    'Najafgarh', 'Narela', 'Connaught Place',
  ],
  Goa: [
    'Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Bicholim', 'Curchorem', 'Canacona',
    'Calangute', 'Candolim', 'Anjuna', 'Porvorim', 'Old Goa', 'Quepem', 'Sanquelim', 'Valpoi',
  ],
  Gujarat: [
    'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar',
    'Junagadh', 'Anand', 'Nadiad', 'Navsari', 'Bharuch', 'Mehsana', 'Morbi', 'Surendranagar',
    'Bhuj', 'Gandhidham', 'Vapi', 'Valsad', 'Palanpur', 'Porbandar', 'Veraval', 'Godhra',
    'Patan', 'Dahod', 'Amreli', 'Botad', 'Jetpur', 'Himatnagar', 'Modasa', 'Deesa',
    'Ankleshwar', 'Kalol', 'Dwarka', 'Somnath', 'Mandvi', 'Statue of Unity',
  ],
  Haryana: [
    'Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal',
    'Sonipat', 'Panchkula', 'Bhiwani', 'Sirsa', 'Bahadurgarh', 'Jind', 'Kurukshetra', 'Kaithal',
    'Rewari', 'Palwal', 'Narnaul', 'Fatehabad', 'Gohana', 'Tohana', 'Hansi', 'Jhajjar',
    'Charkhi Dadri', 'Nuh', 'Pinjore', 'Kalka', 'Manesar',
  ],
  'Himachal Pradesh': [
    'Shimla', 'Solan', 'Dharamshala', 'Mandi', 'Palampur', 'Baddi', 'Nahan', 'Paonta Sahib',
    'Sundernagar', 'Chamba', 'Una', 'Hamirpur', 'Bilaspur', 'Kullu', 'Manali', 'Kangra',
    'Nurpur', 'Dalhousie', 'Kasauli', 'Keylong', 'Reckong Peo', 'Nalagarh', 'McLeod Ganj',
  ],
  'Jammu and Kashmir': [
    'Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Udhampur', 'Kathua', 'Sopore', 'Rajouri',
    'Poonch', 'Kupwara', 'Pulwama', 'Budgam', 'Ganderbal', 'Bandipora', 'Kulgam', 'Shopian',
    'Doda', 'Kishtwar', 'Ramban', 'Reasi', 'Samba', 'Gulmarg', 'Pahalgam', 'Sonamarg', 'Katra',
  ],
  Jharkhand: [
    'Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro Steel City', 'Deoghar', 'Hazaribagh', 'Giridih',
    'Ramgarh', 'Medininagar', 'Phusro', 'Adityapur', 'Chaibasa', 'Chatra', 'Dumka', 'Garhwa',
    'Godda', 'Gumla', 'Jamtara', 'Khunti', 'Koderma', 'Latehar', 'Lohardaga', 'Pakur',
    'Sahibganj', 'Saraikela', 'Simdega', 'Jhumri Telaiya', 'Jasidih', 'Madhupur', 'Chirkunda',
    'Chakradharpur', 'Chandil', 'Chas', 'Ghatshila', 'Gomia', 'Jugsalai', 'Mihijam', 'Nirsa',
    'Patratu', 'Rajmahal', 'Sindri', 'Tenughat', 'Bermo', 'Barhi', 'Bundu', 'Hussainabad',
    'Kharsawan', 'Manoharpur', 'Bagodar', 'Chandrapura', 'Dumri', 'Barkagaon', 'Domchanch',
    'Nagar Untari', 'Bishrampur', 'Rajdhanwar', 'Jharia', 'Katras', 'Baharagora', 'Musabani',
  ],
  Karnataka: [
    'Bengaluru', 'Mysuru', 'Hubballi', 'Dharwad', 'Mangaluru', 'Belagavi', 'Kalaburagi',
    'Davanagere', 'Ballari', 'Vijayapura', 'Shivamogga', 'Tumakuru', 'Raichur', 'Bidar',
    'Hassan', 'Udupi', 'Chitradurga', 'Kolar', 'Mandya', 'Chikkamagaluru', 'Bagalkot', 'Gadag',
    'Haveri', 'Koppal', 'Yadgir', 'Chikkaballapur', 'Ramanagara', 'Karwar', 'Sirsi',
    'Bhadravati', 'Robertsonpet', 'Hospet', 'Gangavathi', 'Ranebennur', 'Madikeri', 'Hampi',
  ],
  Kerala: [
    'Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Alappuzha', 'Kottayam',
    'Palakkad', 'Kannur', 'Kasaragod', 'Malappuram', 'Pathanamthitta', 'Thodupuzha', 'Kalpetta',
    'Guruvayur', 'Munnar', 'Varkala', 'Cherthala', 'Perinthalmanna', 'Tirur', 'Manjeri',
    'Ponnani', 'Chalakudy', 'Aluva', 'Muvattupuzha', 'Thalassery', 'Payyanur', 'Nedumangad',
    'Neyyattinkara', 'Changanassery', 'Thiruvalla', 'Kayamkulam', 'Kumarakom',
  ],
  Ladakh: ['Leh', 'Kargil', 'Diskit', 'Padum', 'Drass', 'Nubra'],
  'Madhya Pradesh': [
    'Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam',
    'Rewa', 'Katni', 'Singrauli', 'Burhanpur', 'Khandwa', 'Morena', 'Bhind', 'Guna', 'Shivpuri',
    'Vidisha', 'Chhindwara', 'Damoh', 'Mandsaur', 'Khargone', 'Neemuch', 'Pithampur',
    'Narmadapuram', 'Itarsi', 'Sehore', 'Betul', 'Seoni', 'Datia', 'Nagda', 'Dhar', 'Balaghat',
    'Chhatarpur', 'Tikamgarh', 'Shahdol', 'Sidhi', 'Harda', 'Mhow', 'Sanchi', 'Maheshwar',
    'Omkareshwar', 'Panna', 'Ashoknagar', 'Rajgarh', 'Shajapur', 'Barwani', 'Jhabua', 'Mandla',
    'Narsinghpur', 'Raisen', 'Khajuraho',
  ],
  Maharashtra: [
    'Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane', 'Chhatrapati Sambhajinagar', 'Solapur',
    'Amravati', 'Kolhapur', 'Navi Mumbai', 'Kalyan', 'Dombivli', 'Vasai', 'Virar', 'Sangli',
    'Jalgaon', 'Akola', 'Latur', 'Dhule', 'Ahmednagar', 'Chandrapur', 'Parbhani',
    'Ichalkaranji', 'Jalna', 'Bhusawal', 'Panvel', 'Satara', 'Beed', 'Yavatmal', 'Dharashiv',
    'Nanded', 'Wardha', 'Udgir', 'Hingoli', 'Ratnagiri', 'Sindhudurg', 'Alibaug', 'Lonavala',
    'Mahabaleshwar', 'Shirdi', 'Karad', 'Baramati', 'Pandharpur', 'Malegaon', 'Gondia',
    'Bhandara', 'Washim', 'Buldhana', 'Nandurbar', 'Palghar', 'Khopoli', 'Igatpuri', 'Wai',
  ],
  Manipur: [
    'Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Kakching', 'Ukhrul', 'Senapati',
    'Tamenglong', 'Jiribam', 'Moreh', 'Chandel', 'Kangpokpi', 'Noney', 'Tengnoupal',
  ],
  Meghalaya: [
    'Shillong', 'Tura', 'Jowai', 'Nongstoin', 'Baghmara', 'Williamnagar', 'Nongpoh',
    'Resubelpara', 'Ampati', 'Mairang', 'Khliehriat', 'Sohra', 'Mawsynram', 'Dawki',
  ],
  Mizoram: [
    'Aizawl', 'Lunglei', 'Champhai', 'Serchhip', 'Kolasib', 'Saiha', 'Lawngtlai', 'Mamit',
    'Khawzawl', 'Hnahthial', 'Saitual',
  ],
  Nagaland: [
    'Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha', 'Zunheboto', 'Mon', 'Phek',
    'Kiphire', 'Longleng', 'Peren', 'Chumukedima', 'Noklak',
  ],
  Odisha: [
    'Bhubaneswar', 'Cuttack', 'Rourkela', 'Brahmapur', 'Sambalpur', 'Puri', 'Balasore',
    'Bhadrak', 'Baripada', 'Jharsuguda', 'Jeypore', 'Bargarh', 'Rayagada', 'Bhawanipatna',
    'Angul', 'Dhenkanal', 'Paradip', 'Kendrapara', 'Jajpur', 'Talcher', 'Sundargarh',
    'Koraput', 'Nabarangpur', 'Nuapada', 'Boudh', 'Sonepur', 'Phulbani', 'Malkangiri',
    'Deogarh', 'Khordha', 'Nayagarh', 'Keonjhar', 'Konark',
  ],
  Puducherry: ['Puducherry', 'Karaikal', 'Yanam', 'Mahe', 'Villianur', 'Ozhukarai', 'Auroville'],
  Punjab: [
    'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Hoshiarpur',
    'Batala', 'Pathankot', 'Moga', 'Abohar', 'Malerkotla', 'Khanna', 'Phagwara', 'Muktsar',
    'Barnala', 'Rajpura', 'Firozpur', 'Kapurthala', 'Sangrur', 'Faridkot', 'Gurdaspur',
    'Zirakpur', 'Nabha', 'Mansa', 'Nawanshahr', 'Fazilka', 'Sunam', 'Tarn Taran', 'Rupnagar',
    'Anandpur Sahib', 'Fatehgarh Sahib', 'Kharar', 'Dera Bassi', 'Jagraon', 'Samana',
  ],
  Rajasthan: [
    'Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Bikaner', 'Ajmer', 'Bhilwara', 'Alwar', 'Sikar',
    'Pali', 'Sri Ganganagar', 'Bharatpur', 'Hanumangarh', 'Jhunjhunu', 'Churu', 'Nagaur',
    'Barmer', 'Tonk', 'Chittorgarh', 'Banswara', 'Dausa', 'Baran', 'Bundi', 'Jaisalmer',
    'Sawai Madhopur', 'Dungarpur', 'Rajsamand', 'Jhalawar', 'Karauli', 'Pratapgarh', 'Sirohi',
    'Mount Abu', 'Beawar', 'Kishangarh', 'Makrana', 'Fatehpur', 'Nathdwara', 'Pushkar',
    'Neemrana', 'Bhiwadi', 'Abu Road', 'Sujangarh', 'Balotra', 'Phalodi',
  ],
  Sikkim: [
    'Gangtok', 'Namchi', 'Gyalshing', 'Mangan', 'Rangpo', 'Singtam', 'Jorethang', 'Ravangla',
    'Pelling', 'Lachung', 'Soreng', 'Pakyong',
  ],
  'Tamil Nadu': [
    'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Tiruppur',
    'Erode', 'Vellore', 'Thoothukudi', 'Dindigul', 'Thanjavur', 'Ranipet', 'Sivakasi', 'Karur',
    'Udhagamandalam', 'Hosur', 'Nagercoil', 'Kanchipuram', 'Kumbakonam', 'Cuddalore',
    'Karaikudi', 'Neyveli', 'Tiruvannamalai', 'Pollachi', 'Rajapalayam', 'Pudukkottai',
    'Ambur', 'Nagapattinam', 'Virudhunagar', 'Mayiladuthurai', 'Krishnagiri', 'Namakkal',
    'Perambalur', 'Ariyalur', 'Villupuram', 'Tenkasi', 'Theni', 'Ramanathapuram', 'Sivaganga',
    'Dharmapuri', 'Tirupathur', 'Kallakurichi', 'Chengalpattu', 'Tambaram', 'Avadi',
    'Mahabalipuram', 'Yercaud', 'Kodaikanal', 'Rameswaram',
  ],
  Telangana: [
    'Hyderabad', 'Secunderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam',
    'Ramagundam', 'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Suryapet', 'Miryalaguda', 'Jagtial',
    'Mancherial', 'Siddipet', 'Kothagudem', 'Bhongir', 'Sangareddy', 'Medak', 'Vikarabad',
    'Wanaparthy', 'Nagarkurnool', 'Gadwal', 'Kamareddy', 'Peddapalli', 'Jangaon',
    'Bhadrachalam', 'Nirmal', 'Mulugu', 'Narayanpet', 'Sircilla', 'Medchal', 'Shamshabad',
  ],
  Tripura: [
    'Agartala', 'Udaipur', 'Dharmanagar', 'Kailashahar', 'Belonia', 'Ambassa', 'Khowai',
    'Sabroom', 'Sonamura', 'Teliamura', 'Melaghar', 'Kamalpur', 'Bishalgarh',
  ],
  'Uttar Pradesh': [
    'Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Meerut', 'Prayagraj', 'Bareilly',
    'Aligarh', 'Moradabad', 'Saharanpur', 'Gorakhpur', 'Noida', 'Greater Noida', 'Firozabad',
    'Jhansi', 'Muzaffarnagar', 'Mathura', 'Vrindavan', 'Rampur', 'Shahjahanpur', 'Farrukhabad',
    'Ayodhya', 'Faizabad', 'Hapur', 'Etawah', 'Mirzapur', 'Bulandshahr', 'Sambhal', 'Amroha',
    'Hardoi', 'Fatehpur', 'Raebareli', 'Orai', 'Sitapur', 'Bahraich', 'Unnao', 'Jaunpur',
    'Lakhimpur', 'Hathras', 'Banda', 'Pilibhit', 'Barabanki', 'Gonda', 'Mainpuri', 'Lalitpur',
    'Etah', 'Deoria', 'Ghazipur', 'Sultanpur', 'Azamgarh', 'Bijnor', 'Basti', 'Ballia', 'Mau',
    'Kannauj', 'Kasganj', 'Kushinagar', 'Maharajganj', 'Bhadohi', 'Sonbhadra', 'Chandauli',
    'Amethi', 'Balrampur', 'Loni', 'Baghpat', 'Chitrakoot', 'Sarnath',
  ],
  Uttarakhand: [
    'Dehradun', 'Haridwar', 'Rishikesh', 'Roorkee', 'Haldwani', 'Kashipur', 'Rudrapur',
    'Nainital', 'Mussoorie', 'Almora', 'Pithoragarh', 'Kotdwar', 'Ramnagar', 'Pauri',
    'Srinagar Garhwal', 'New Tehri', 'Bageshwar', 'Champawat', 'Gopeshwar', 'Uttarkashi',
    'Rudraprayag', 'Jaspur', 'Manglaur', 'Sitarganj', 'Khatima', 'Vikasnagar', 'Doiwala',
    'Auli', 'Badrinath', 'Kedarnath',
  ],
  'West Bengal': [
    'Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman', 'Malda', 'Baharampur',
    'Habra', 'Kharagpur', 'Shantipur', 'Dankuni', 'Darjeeling', 'Kalimpong', 'Jalpaiguri',
    'Cooch Behar', 'Alipurduar', 'Raiganj', 'Balurghat', 'Krishnanagar', 'Barasat',
    'Bidhannagar', 'Serampore', 'Chandannagar', 'Hooghly', 'Bankura', 'Purulia', 'Midnapore',
    'Haldia', 'Tamluk', 'Diamond Harbour', 'Basirhat', 'Bongaon', 'Nabadwip', 'Katwa', 'Kalna',
    'Arambagh', 'Suri', 'Bolpur', 'Rampurhat', 'Jhargram', 'Digha', 'Barrackpore', 'Naihati',
    'Kanchrapara', 'Bhatpara', 'Titagarh', 'Uttarpara',
  ],
  'Andaman and Nicobar Islands': [
    'Port Blair', 'Swaraj Dweep', 'Shaheed Dweep', 'Diglipur', 'Mayabunder', 'Rangat',
    'Car Nicobar', 'Campbell Bay',
  ],
  Chandigarh: ['Chandigarh', 'Manimajra'],
  'Dadra and Nagar Haveli and Daman and Diu': [
    'Silvassa', 'Daman', 'Diu', 'Moti Daman', 'Nani Daman',
  ],
  Lakshadweep: ['Kavaratti', 'Agatti', 'Minicoy', 'Amini', 'Andrott', 'Kadmat', 'Bangaram'],
}
