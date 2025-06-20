import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Alert, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { userService } from '@/services/userService';

interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
  onLoginSuccess: (user: any) => void;
}

const { width } = Dimensions.get('window');

export default function LoginModal({ visible, onClose, onLoginSuccess }: LoginModalProps) {
  const [loginType, setLoginType] = useState<'wechat' | 'phone' | 'guest'>('wechat');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleWechatLogin = async () => {
    try {
      setIsLoading(true);
      const user = await userService.loginWithWechat();
      onLoginSuccess(user);
    } catch (error: any) {
      Alert.alert('登录失败', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendCode = async () => {
    if (!phone || phone.length !== 11) {
      Alert.alert('提示', '请输入正确的手机号');
      return;
    }

    try {
      setIsLoading(true);
      await userService.sendVerificationCode(phone);
      setCodeSent(true);
      setCountdown(60);
      
      // 倒计时
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      Alert.alert('验证码已发送', '请查收短信验证码（测试码：123456）');
    } catch (error: any) {
      Alert.alert('发送失败', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneLogin = async () => {
    if (!phone || !code) {
      Alert.alert('提示', '请输入手机号和验证码');
      return;
    }

    try {
      setIsLoading(true);
      const user = await userService.loginWithPhone(phone, code);
      onLoginSuccess(user);
    } catch (error: any) {
      Alert.alert('登录失败', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      setIsLoading(true);
      const user = await userService.loginAsGuest();
      onLoginSuccess(user);
    } catch (error: any) {
      Alert.alert('登录失败', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setPhone('');
    setCode('');
    setCodeSent(false);
    setCountdown(0);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* 头部 */}
          <View style={styles.header}>
            <Text style={styles.title}>登录</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Feather name="x" size={24} color="#666666" />
            </TouchableOpacity>
          </View>

          {/* 登录方式选择 */}
          <View style={styles.loginTypeContainer}>
            <TouchableOpacity
              style={[styles.loginTypeButton, loginType === 'wechat' && styles.loginTypeButtonActive]}
              onPress={() => setLoginType('wechat')}
            >
              <Feather name="message-circle" size={20} color={loginType === 'wechat' ? '#FFFFFF' : '#666666'} />
              <Text style={[styles.loginTypeText, loginType === 'wechat' && styles.loginTypeTextActive]}>
                微信登录
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginTypeButton, loginType === 'phone' && styles.loginTypeButtonActive]}
              onPress={() => setLoginType('phone')}
            >
              <Feather name="phone" size={20} color={loginType === 'phone' ? '#FFFFFF' : '#666666'} />
              <Text style={[styles.loginTypeText, loginType === 'phone' && styles.loginTypeTextActive]}>
                手机登录
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginTypeButton, loginType === 'guest' && styles.loginTypeButtonActive]}
              onPress={() => setLoginType('guest')}
            >
              <Feather name="user" size={20} color={loginType === 'guest' ? '#FFFFFF' : '#666666'} />
              <Text style={[styles.loginTypeText, loginType === 'guest' && styles.loginTypeTextActive]}>
                游客模式
              </Text>
            </TouchableOpacity>
          </View>

          {/* 登录内容 */}
          <View style={styles.loginContent}>
            {loginType === 'wechat' && (
              <View style={styles.wechatLogin}>
                <View style={styles.wechatIcon}>
                  <Feather name="message-circle" size={48} color="#22C55E" />
                </View>
                <Text style={styles.wechatTitle}>微信快速登录</Text>
                <Text style={styles.wechatSubtitle}>
                  使用微信账号快速登录，享受数据同步服务
                </Text>
                <TouchableOpacity 
                  style={styles.wechatButton} 
                  onPress={handleWechatLogin}
                  disabled={isLoading}
                >
                  <Feather name="message-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.wechatButtonText}>
                    {isLoading ? '登录中...' : '微信登录'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {loginType === 'phone' && (
              <View style={styles.phoneLogin}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>手机号</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="请输入手机号"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    maxLength={11}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>验证码</Text>
                  <View style={styles.codeInputContainer}>
                    <TextInput
                      style={[styles.input, styles.codeInput]}
                      placeholder="请输入验证码"
                      value={code}
                      onChangeText={setCode}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                    <TouchableOpacity
                      style={[styles.sendCodeButton, countdown > 0 && styles.sendCodeButtonDisabled]}
                      onPress={handleSendCode}
                      disabled={countdown > 0 || isLoading}
                    >
                      <Text style={[styles.sendCodeText, countdown > 0 && styles.sendCodeTextDisabled]}>
                        {countdown > 0 ? `${countdown}s` : '发送验证码'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.phoneButton} 
                  onPress={handlePhoneLogin}
                  disabled={isLoading}
                >
                  <Text style={styles.phoneButtonText}>
                    {isLoading ? '登录中...' : '登录'}
                  </Text>
                  <Feather name="arrow-right" size={20} color="#FFFFFF" />
                </TouchableOpacity>

                <Text style={styles.phoneHint}>
                  测试验证码：123456
                </Text>
              </View>
            )}

            {loginType === 'guest' && (
              <View style={styles.guestLogin}>
                <View style={styles.guestIcon}>
                  <Feather name="user" size={48} color="#8B5CF6" />
                </View>
                <Text style={styles.guestTitle}>游客模式</Text>
                <Text style={styles.guestSubtitle}>
                  无需注册，立即体验所有功能{'\n'}
                  注意：游客模式下数据仅保存在本地
                </Text>
                <TouchableOpacity 
                  style={styles.guestButton} 
                  onPress={handleGuestLogin}
                  disabled={isLoading}
                >
                  <Feather name="user" size={20} color="#FFFFFF" />
                  <Text style={styles.guestButtonText}>
                    {isLoading ? '登录中...' : '游客登录'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* 协议提示 */}
          <View style={styles.agreementContainer}>
            <Text style={styles.agreementText}>
              登录即表示同意
              <Text style={styles.agreementLink}>《用户协议》</Text>
              和
              <Text style={styles.agreementLink}>《隐私政策》</Text>
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111111',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginTypeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  loginTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  loginTypeButtonActive: {
    backgroundColor: '#3B82F6',
  },
  loginTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginLeft: 6,
  },
  loginTypeTextActive: {
    color: '#FFFFFF',
  },
  loginContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  
  // 微信登录样式
  wechatLogin: {
    alignItems: 'center',
  },
  wechatIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  wechatTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 8,
  },
  wechatSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  wechatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  wechatButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // 手机登录样式
  phoneLogin: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111111',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111111',
    backgroundColor: '#FFFFFF',
  },
  codeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeInput: {
    flex: 1,
    marginRight: 12,
  },
  sendCodeButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  sendCodeButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  sendCodeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  sendCodeTextDisabled: {
    color: '#9CA3AF',
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 12,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  phoneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  phoneHint: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    marginTop: 12,
  },

  // 游客登录样式
  guestLogin: {
    alignItems: 'center',
  },
  guestIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 8,
  },
  guestSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  guestButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // 协议样式
  agreementContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  agreementText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 18,
  },
  agreementLink: {
    color: '#3B82F6',
    fontWeight: '500',
  },
});