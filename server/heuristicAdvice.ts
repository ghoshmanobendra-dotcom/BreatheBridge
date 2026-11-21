export function getLocalizedAdvice(language: string): string[] {
  if (language === 'bn') {
    return [
      'শিশুর ঘর ও শোবার ঘরে সিএডিআর রেটেড হেপা এয়ার পিউরিফায়ার (ন্যূনতম ৪ এসিএইচ) ব্যবহার করুন।',
      'ভোরের শান্ত বাতাসের সময় (সকাল ৬:০০ - ১০:০০) কক্ষ কখনই বায়ুচলাচলের জন্য খুলবেন না।',
      'বাইরে বের হলে N95 / FFP2 রেসপিরেটর ব্যবহার করুন; সাধারণ কাপড়ের মাস্ক PM2.5 রোধ করতে পারে না।',
      'একিউআই ১৫০ অতিক্রম করলে বয়স্ক প্রতিবেশী ও হাঁপানি রোগীদের খোঁজ নিন।',
    ];
  }
  if (language === 'hi') {
    return [
      'नर्सरी और बेडरूम में CADR-रेटेड HEPA एयर प्यूरीफायर (न्यूनतम 4 ACH) लगाएं।',
      'सुबह की शांत हवा (6:00 AM - 10:00 AM) के दौरान खिड़कियां कभी न खोलें।',
      'बाहर जाते समय N95 / FFP2 मास्क का उपयोग करें; साधारण कपड़े का मास्क PM2.5 को नहीं रोकता।',
      'AQI 150 से अधिक होने पर बुजुर्ग पड़ोसियों और अस्थमा से पीड़ित परिजनों का हालचाल लें।',
    ];
  }
  if (language === 'ar') {
    return [
      'زوّد غرف الأطفال والنوم بأجهزة تنقية HEPA بمعيار CADR المناسب (4 دورات هواء/ساعة).',
      'تجنب تهوية الغرف في ساعات الصباح الباكر (6:00 إلى 10:00 صباحاً).',
      'استخدم كمامات N95 / FFP2 عند الخروج إلى الهواء الطلق.',
      'اطمئن على كبار السن ومرضى الربو عندما يتجاوز مؤشر الهواء 150.',
    ];
  }
  if (language === 'es') {
    return [
      'Equipe dormitorios con purificadores HEPA certificados para CADR (mínimo 4 ACH).',
      'Nunca ventile habitaciones durante las horas tempranas de la mañana (6:00 AM - 10:00 AM).',
      'Use respiradores N95 / FFP2 al salir al exterior; las mascarillas de tela no filtran PM2.5.',
      'Verifique el estado de adultos mayores y familiares con asma cuando el AQI supere 150.',
    ];
  }
  return [
    'Equip nursery and bedrooms with CADR-rated HEPA purification (minimum 4 ACH).',
    'Never ventilate rooms during early morning calm winds (6:00 AM - 10:00 AM).',
    'Use N95 / FFP2 respirators if stepping outdoors; simple cloth masks fail against PM2.5.',
    'Check in on elderly neighbors and asthmatic family members when AQI exceeds 150.',
  ];
}

export function getLocalizedRationale(safeStart: number, safeEnd: number, language: string): string {
  if (language === 'bn') {
    return `সৌর তাপীয় সংবহন সকাল ${safeStart}:০০ এবং বিকাল ${safeEnd}:০০ এর মধ্যে ধোঁয়াশার চাদর ভেঙে দেয়। মাটির PM2.5 ৩৫% পর্যন্ত হ্রাস পায়।`;
  }
  if (language === 'hi') {
    return `सौर तापीय संवहन दोपहर ${safeStart}:00 और ${safeEnd}:00 के बीच स्मॉग की चादर को तोड़ता है। सतह का PM2.5 35% तक कम हो जाता है।`;
  }
  if (language === 'ar') {
    return `الحمل الحراري الشمسي يكسر طبقة الضباب الدخاني بين ${safeStart}:00 و ${safeEnd}:00. تنخفض جزيئات PM2.5 بنسبة تصل إلى 35٪.`;
  }
  if (language === 'es') {
    return `La convección térmica solar dispersa la capa de esmog entre las ${safeStart}:00 y las ${safeEnd}:00. El PM2.5 en superficie cae hasta un 35%.`;
  }
  return `Thermal solar convection breaks the smog blanket between ${safeStart}:00 and ${safeEnd}:00. Ground PM2.5 drops by up to 35%.`;
}
