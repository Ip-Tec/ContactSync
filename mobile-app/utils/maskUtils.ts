export const maskPhone = (phone: string): string => {
    if (!phone) return "";
    return phone.replace(/(\d{3})\d{4}(\d{2,})/, "$1****$2");
  };
  
  export const maskEmail = (email: string): string => {
    if (!email) return "";
    const [name, domain] = email.split("@");
    if (!domain) return email;
    
    const maskedName = name.length > 2 ? name[0] + "*".repeat(name.length - 2) + name[name.length - 1] : name;
    return `${maskedName}@${domain}`;
  };
  