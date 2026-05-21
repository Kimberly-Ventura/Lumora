import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TextInput, 
  Pressable, 
  Dimensions, 
  Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { FooterHero } from '@/components/FooterHero';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width: windowWidth } = Dimensions.get('window');

export default function ContactScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  // Form Fields State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  // UI Flow States
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedName, setSubmittedName] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');

  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && windowWidth > 992;
  const contentWidth = isWeb ? Math.min(windowWidth, 1200) : windowWidth;
  const headerHeight = isWeb ? 70 : 110;

  const handleSend = () => {
    // Basic validation
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setErrorMessage('Please provide information in all fields before sending.');
      return;
    }

    // Email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('Please provide a valid email address so we can reach you.');
      return;
    }

    // Success State Trigger
    setErrorMessage('');
    setSubmittedName(name.trim());
    setSubmittedEmail(email.trim());
    setSubmitted(true);

    // Reset Form fields internally
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
  };

  const handleResetForm = () => {
    setSubmitted(false);
    setSubmittedName('');
    setSubmittedEmail('');
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent, 
          { paddingTop: headerHeight },
          isWeb && styles.webScrollContent
        ]}
      >
        <View style={[styles.innerLayout, { width: contentWidth }]}>
          
          {/* Header Title Section */}
          <View style={styles.titleContainer}>
            <ThemedText style={styles.subtitle}>CONCIERGE SERVICE</ThemedText>
            <ThemedText style={styles.title}>Connect with Lumora</ThemedText>
            <ThemedText style={styles.description}>
              Whether curating a single private room or detailing a complete residential workspace design, our client advisory board is at your immediate service.
            </ThemedText>
          </View>

          {/* Main Layout Grid */}
          <View style={[styles.layoutGrid, isDesktop && styles.desktopLayoutGrid]}>
            
            {/* Showroom & Location Info Card (Left) */}
            <View style={[styles.showroomCard, { backgroundColor: '#FDFBF9' }, isDesktop && { flex: 1.1 }]}>
              <ThemedText style={styles.cardHeaderTitle}>FLAGSHIP SANCTUARY</ThemedText>
              
              <View style={styles.locationSection}>
                <View style={styles.locationLabelRow}>
                  <Ionicons name="location-outline" size={16} color="#A06E50" />
                  <ThemedText style={styles.locationLabel}>New York Gallery</ThemedText>
                </View>
                <ThemedText style={styles.locationValue}>
                  740 Madison Avenue{'\n'}New York, NY 10021
                </ThemedText>
              </View>

              <View style={styles.locationSection}>
                <View style={styles.locationLabelRow}>
                  <Ionicons name="time-outline" size={16} color="#A06E50" />
                  <ThemedText style={styles.locationLabel}>Gallery Hours</ThemedText>
                </View>
                <ThemedText style={styles.locationValue}>
                  Monday - Saturday: 10:00 AM - 6:00 PM{'\n'}
                  Sunday: Private Gallery Bookings Only
                </ThemedText>
              </View>

              <View style={styles.locationSection}>
                <View style={styles.locationLabelRow}>
                  <Ionicons name="mail-outline" size={16} color="#A06E50" />
                  <ThemedText style={styles.locationLabel}>Digital Concierge</ThemedText>
                </View>
                <ThemedText style={styles.locationValue}>
                  concierge@lumora.design{'\n'}
                  designboard@lumora.design
                </ThemedText>
              </View>

              <View style={styles.locationSection}>
                <View style={styles.locationLabelRow}>
                  <Ionicons name="call-outline" size={16} color="#A06E50" />
                  <ThemedText style={styles.locationLabel}>Direct Inquiry Line</ThemedText>
                </View>
                <ThemedText style={styles.locationValue}>
                  +1 (212) 555-0190{'\n'}
                  +1 (212) 555-0198
                </ThemedText>
              </View>

              {/* AR/VR Gallery Pill */}
              <View style={styles.exclusivePill}>
                <Ionicons name="sparkles-outline" size={16} color="#A06E50" />
                <ThemedText style={styles.exclusivePillText}>
                  Complimentary 3D layout simulation is included with every digital curatorial request.
                </ThemedText>
              </View>
            </View>

            {/* Messaging Form (Right) */}
            <View style={[styles.messagingCard, { backgroundColor: '#FFFFFF' }, isDesktop && { flex: 1.3 }]}>
              
              {submitted ? (
                /* SUCCESS STATE PANEL */
                <View style={styles.successContainer}>
                  <View style={styles.successIconCircle}>
                    <Ionicons name="checkmark-circle-outline" size={44} color="#A06E50" />
                  </View>
                  
                  <ThemedText style={styles.successTitle}>Inquiry Logged</ThemedText>
                  
                  <ThemedText style={styles.successSubtitle}>
                    Thank you, <ThemedText style={styles.boldText}>{submittedName}</ThemedText>.
                  </ThemedText>
                  
                  <ThemedText style={styles.successText}>
                    Your transmission has been successfully routed to our global design advisory board. A dedicated Lumora concierge will review your inquiry and connect with you at <ThemedText style={styles.boldText}>{submittedEmail}</ThemedText> within 24 business hours to curate your spatial journey.
                  </ThemedText>

                  <Pressable style={styles.resetButton} onPress={handleResetForm}>
                    <ThemedText style={styles.resetButtonText}>SEND ANOTHER MESSAGE</ThemedText>
                  </Pressable>
                </View>
              ) : (
                /* REGULAR ENTRY FORM */
                <View style={styles.formContainer}>
                  <ThemedText style={styles.cardHeaderTitle}>DIRECT MESSAGING</ThemedText>
                  
                  {/* Warning Alerts */}
                  {errorMessage ? (
                    <View style={styles.errorAlert}>
                      <Ionicons name="alert-circle-outline" size={16} color="#C0392B" style={{ marginRight: 6 }} />
                      <ThemedText style={styles.errorAlertText}>{errorMessage}</ThemedText>
                    </View>
                  ) : null}

                  {/* Input Fields */}
                  <View style={styles.inputGroup}>
                    <ThemedText style={styles.inputLabel}>YOUR NAME</ThemedText>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Adrian Thorne"
                      placeholderTextColor="#AAA"
                      value={name}
                      onChangeText={setName}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <ThemedText style={styles.inputLabel}>EMAIL ADDRESS</ThemedText>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. adrian@domain.com"
                      placeholderTextColor="#AAA"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <ThemedText style={styles.inputLabel}>SUBJECT</ThemedText>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Custom Modular Sofa Materials Curation"
                      placeholderTextColor="#AAA"
                      value={subject}
                      onChangeText={setSubject}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <ThemedText style={styles.inputLabel}>MESSAGE</ThemedText>
                    <TextInput
                      style={[styles.textInput, styles.textAreaInput]}
                      placeholder="Detail your request, spaces, or piece curations..."
                      placeholderTextColor="#AAA"
                      multiline={true}
                      numberOfLines={5}
                      value={message}
                      onChangeText={setMessage}
                    />
                  </View>

                  <Pressable style={styles.submitBtn} onPress={handleSend}>
                    <Ionicons name="mail-unread-outline" size={16} color="#F6F1EB" style={{ marginRight: 8 }} />
                    <ThemedText style={styles.submitBtnText}>SEND TRANSMISSION</ThemedText>
                  </Pressable>
                </View>
              )}

            </View>

          </View>

        </View>

        {/* Footer */}
        <FooterHero />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
  },
  webScrollContent: {
    alignItems: 'center',
  },
  innerLayout: {
    paddingHorizontal: Spacing.m,
    paddingTop: Spacing.xl,
    minHeight: 520,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: '#A06E50',
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 36,
    color: '#111',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 640,
  },
  layoutGrid: {
    flexDirection: 'column',
    gap: 30,
    marginBottom: Spacing.xl,
  },
  desktopLayoutGrid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 40,
  },
  showroomCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EEE',
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 8,
    elevation: 2,
  },
  messagingCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EEE',
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 20,
    color: '#111',
    letterSpacing: 0.5,
    marginBottom: 24,
  },
  locationSection: {
    marginBottom: 20,
  },
  locationLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  locationLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#A06E50',
    letterSpacing: 1,
  },
  locationValue: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
  exclusivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F3EE',
    padding: 16,
    borderRadius: 14,
    gap: 10,
    marginTop: 15,
  },
  exclusivePillText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#7C5B42',
    lineHeight: 16,
  },
  
  /* MESSAGING FORM STYLINGS */
  formContainer: {
    width: '100%',
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDEDEC',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FADBD8',
    marginBottom: 20,
  },
  errorAlertText: {
    flex: 1,
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#C0392B',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    color: '#888',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  textInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#111',
    backgroundColor: '#FAFAFA',
    outlineStyle: 'none' as any,
  },
  textAreaInput: {
    height: 120,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#111111',
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#F6F1EB',
    letterSpacing: 1.5,
  },

  /* SUCCESS STATE STYLINGS */
  successContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    textAlign: 'center',
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F6F1EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E7E0D8',
  },
  successTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 24,
    color: '#111',
    marginBottom: 8,
  },
  successSubtitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    color: '#A06E50',
    marginBottom: 16,
  },
  successText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#666',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 30,
    maxWidth: 440,
  },
  boldText: {
    fontFamily: 'Inter-Bold',
    color: '#111',
  },
  resetButton: {
    borderWidth: 1,
    borderColor: '#111',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  resetButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    color: '#111',
    letterSpacing: 1.5,
  },
});
