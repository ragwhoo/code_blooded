package com.botguard.geo;

public class GeoLocation {
    private String country;
    private String countryCode;
    private String city;
    private long asn;
    private String isp;
    private double latitude;
    private double longitude;

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public long getAsn() { return asn; }
    public void setAsn(long asn) { this.asn = asn; }
    public String getIsp() { return isp; }
    public void setIsp(String isp) { this.isp = isp; }
    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }
    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }
}
