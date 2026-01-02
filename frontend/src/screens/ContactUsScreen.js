import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../components/Header';
import { useToast, useLoading } from '../context/ToastContext';

const ContactUsScreen = () => {
  const insets = useSafeAreaInsets();
  const { showError, showSuccess } = useToast();
  const { showLoading, hideLoading } = useLoading();
  
  const [activeTab, setActiveTab] = useState('contact');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateField = (field, value) => {
    const newErrors = { ...errors };
    switch (field) {
      case 'name':
        if (!value?.trim()) {
          newErrors.name = 'Name is required';
        } else {
          delete newErrors.name;
        }
        break;
      case 'email':
        if (!value?.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          newErrors.email = 'Please enter a valid email';
        } else {
          delete newErrors.email;
        }
        break;
      case 'phone':
        if (!value?.trim()) {
          newErrors.phone = 'Phone number is required';
        } else if (value.replace(/\D/g, '').length !== 10) {
          newErrors.phone = 'Phone number must be 10 digits';
        } else {
          delete newErrors.phone;
        }
        break;
      case 'subject':
        if (!value?.trim()) {
          newErrors.subject = 'Subject is required';
        } else {
          delete newErrors.subject;
        }
        break;
      case 'message':
        if (!value?.trim()) {
          newErrors.message = 'Message is required';
        } else if (value.trim().length < 10) {
          newErrors.message = 'Message must be at least 10 characters';
        } else {
          delete newErrors.message;
        }
        break;
    }
    setErrors(newErrors);
  };

  const handleSubmit = async () => {
    // Validate all fields
    validateField('name', formData.name);
    validateField('email', formData.email);
    validateField('phone', formData.phone);
    validateField('subject', formData.subject);
    validateField('message', formData.message);

    if (Object.keys(errors).length > 0) {
      showError('Please fix the errors in the form');
      return;
    }

    if (!formData.name || !formData.email || !formData.phone || !formData.subject || !formData.message) {
      showError('Please fill in all fields');
      return;
    }

    setLoading(true);
    showLoading('Sending message...');
    
    // Simulate API call (replace with actual API endpoint when available)
    setTimeout(() => {
      hideLoading();
      setLoading(false);
      showSuccess('Thank you! Your message has been sent. We will get back to you soon.');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
      setErrors({});
    }, 1500);
  };

  const handleCall = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`).catch(err => {
      console.error('Failed to open phone:', err);
      showError('Unable to make phone call');
    });
  };

  const handleEmail = (email) => {
    Linking.openURL(`mailto:${email}`).catch(err => {
      console.error('Failed to open email:', err);
      showError('Unable to open email client');
    });
  };

  const handleOpenLink = (url) => {
    Linking.openURL(url).catch(err => {
      console.error('Failed to open URL:', err);
      showError('Unable to open link');
    });
  };

  const renderContactUs = () => (
    <ScrollView 
      contentContainerStyle={styles.tabContent} 
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Get in Touch</Text>
        <Text style={styles.sectionDescription}>
          Reach out to us through any of the following channels. We're here to help!
        </Text>

        {/* Contact Information Cards */}
        <View style={styles.contactCards}>
          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => handleCall('+977-1-1234567')}
          >
            <View style={[styles.contactIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="call-outline" size={28} color="#1976D2" />
            </View>
            <Text style={styles.contactLabel}>Phone</Text>
            <Text style={styles.contactValue}>+977-1-1234567</Text>
            <Text style={styles.contactSubtext}>Tap to call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => handleEmail('support@pathaideu.com')}
          >
            <View style={[styles.contactIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="mail-outline" size={28} color="#F57C00" />
            </View>
            <Text style={styles.contactLabel}>Email</Text>
            <Text style={styles.contactValue}>support@pathaideu.com</Text>
            <Text style={styles.contactSubtext}>Tap to email</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contactCards}>
          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => handleOpenLink('https://maps.google.com')}
          >
            <View style={[styles.contactIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="location-outline" size={28} color="#388E3C" />
            </View>
            <Text style={styles.contactLabel}>Address</Text>
            <Text style={styles.contactValue}>Kathmandu, Nepal</Text>
            <Text style={styles.contactSubtext}>Tap to view map</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => handleOpenLink('https://facebook.com')}
          >
            <View style={[styles.contactIcon, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="logo-facebook" size={28} color="#1877F2" />
            </View>
            <Text style={styles.contactLabel}>Social Media</Text>
            <Text style={styles.contactValue}>Follow Us</Text>
            <Text style={styles.contactSubtext}>Tap to visit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderSendMessage = () => (
    <ScrollView 
      contentContainerStyle={styles.tabContent} 
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Send us a Message</Text>
        <Text style={styles.sectionDescription}>
          Have a question or feedback? Fill out the form below and we'll get back to you as soon as possible.
        </Text>

        {/* Name Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#7F8C8D" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Enter your name"
              placeholderTextColor="#BDC3C7"
              value={formData.name}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, name: text }));
                if (errors.name) {
                  validateField('name', text);
                }
              }}
              onBlur={() => validateField('name', formData.name)}
            />
          </View>
          {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
        </View>

        {/* Email Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#7F8C8D" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="Enter your email"
              placeholderTextColor="#BDC3C7"
              value={formData.email}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, email: text }));
                if (errors.email) {
                  validateField('email', text);
                }
              }}
              onBlur={() => validateField('email', formData.email)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
        </View>

        {/* Phone Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color="#7F8C8D" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, errors.phone && styles.inputError]}
              placeholder="Enter your phone number"
              placeholderTextColor="#BDC3C7"
              value={formData.phone}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, phone: text }));
                if (errors.phone) {
                  validateField('phone', text);
                }
              }}
              onBlur={() => validateField('phone', formData.phone)}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
          {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
        </View>

        {/* Subject Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Subject *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="document-text-outline" size={20} color="#7F8C8D" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, errors.subject && styles.inputError]}
              placeholder="Enter subject"
              placeholderTextColor="#BDC3C7"
              value={formData.subject}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, subject: text }));
                if (errors.subject) {
                  validateField('subject', text);
                }
              }}
              onBlur={() => validateField('subject', formData.subject)}
            />
          </View>
          {errors.subject ? <Text style={styles.errorText}>{errors.subject}</Text> : null}
        </View>

        {/* Message Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Message *</Text>
          <View style={[styles.inputContainer, styles.messageContainer, errors.message && styles.inputError]}>
            <TextInput
              style={[styles.input, styles.messageInput]}
              placeholder="Enter your message (minimum 10 characters)"
              placeholderTextColor="#BDC3C7"
              value={formData.message}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, message: text }));
                if (errors.message) {
                  validateField('message', text);
                }
              }}
              onBlur={() => validateField('message', formData.message)}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>
          {errors.message ? <Text style={styles.errorText}>{errors.message}</Text> : null}
        </View>
      </View>
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Header title="Contact Us" />
      
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab('contact')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'contact' && styles.tabTextActive
          ]}>
            Contact Us
          </Text>
          {activeTab === 'contact' && <View style={styles.tabUnderline} />}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab('message')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'message' && styles.tabTextActive
          ]}>
            Send us a Message
          </Text>
          {activeTab === 'message' && <View style={styles.tabUnderline} />}
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'contact' && renderContactUs()}
      {activeTab === 'message' && renderSendMessage()}

      {/* Submit Button - Only show on message tab */}
      {activeTab === 'message' && (
        <View style={styles.submitButtonContainer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Ionicons name="send-outline" size={20} color="#fff" />
            <Text style={styles.submitButtonText}>Send Message</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Business Hours - Always visible at bottom */}
      <View style={styles.businessHoursContainer}>
        <Text style={styles.businessHoursTitle}>Business Hours</Text>
        <View style={styles.hoursList}>
          <View style={styles.hoursItem}>
            <Text style={styles.hoursDay}>Monday - Friday</Text>
            <Text style={styles.hoursTime}>9:00 AM - 6:00 PM</Text>
          </View>
          <View style={styles.hoursItem}>
            <Text style={styles.hoursDay}>Saturday</Text>
            <Text style={styles.hoursTime}>10:00 AM - 4:00 PM</Text>
          </View>
          <View style={styles.hoursItem}>
            <Text style={styles.hoursDay}>Sunday</Text>
            <Text style={styles.hoursTime}>Closed</Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    position: 'relative',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#007AFF',
  },
  tabContent: {
    flexGrow: 1,
    padding: 15,
    paddingBottom: 200,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  contactCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  contactCard: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  contactIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  contactSubtext: {
    fontSize: 11,
    color: '#999',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  messageContainer: {
    alignItems: 'flex-start',
    paddingTop: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 14,
  },
  messageInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  errorText: {
    marginTop: 5,
    fontSize: 12,
    color: '#F44336',
  },
  submitButtonContainer: {
    position: 'absolute',
    bottom: 140,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: 15,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  businessHoursContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: 30,
  },
  businessHoursTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  hoursList: {
    marginTop: 4,
  },
  hoursItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  hoursDay: {
    fontSize: 14,
    color: '#666',
  },
  hoursTime: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
});

export default ContactUsScreen;
