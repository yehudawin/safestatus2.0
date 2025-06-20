import os
from typing import Optional, Dict, Any
from supabase import create_client, Client
from datetime import datetime
import json

class SupabaseDB:
    def __init__(self):
        # Get environment variables
        self.url = os.getenv('SUPABASE_URL', '')
        self.key = os.getenv('SUPABASE_ANON_KEY', '')
        
        if not self.url or not self.key:
            print("⚠️  Warning: Supabase credentials not found, using in-memory storage")
            self.client = None
            self.in_memory_users = {}
        else:
            try:
                self.client: Client = create_client(self.url, self.key)
                print("✅ Connected to Supabase successfully")
            except Exception as e:
                print(f"❌ Failed to connect to Supabase: {e}")
                self.client = None
                self.in_memory_users = {}

    async def create_user(self, phone: str) -> Dict[str, Any]:
        """Create a new user"""
        user_data = {
            'phone': phone,
            'status': 'no-update',
            'join_date': datetime.now().isoformat(),
            'last_update': None,
            'verified': False
        }
        
        if self.client:
            try:
                result = self.client.table('users').insert(user_data).execute()
                return result.data[0] if result.data else user_data
            except Exception as e:
                print(f"Error creating user in Supabase: {e}")
                # Fallback to in-memory
                self.in_memory_users[phone] = user_data
                return user_data
        else:
            # In-memory storage
            self.in_memory_users[phone] = user_data
            return user_data

    async def get_user(self, phone: str) -> Optional[Dict[str, Any]]:
        """Get user by phone number"""
        if self.client:
            try:
                result = self.client.table('users').select('*').eq('phone', phone).execute()
                return result.data[0] if result.data else None
            except Exception as e:
                print(f"Error getting user from Supabase: {e}")
                # Fallback to in-memory
                return self.in_memory_users.get(phone)
        else:
            # In-memory storage
            return self.in_memory_users.get(phone)

    async def update_user_status(self, phone: str, status: str) -> bool:
        """Update user status"""
        update_data = {
            'status': status,
            'last_update': datetime.now().isoformat()
        }
        
        if self.client:
            try:
                result = self.client.table('users').update(update_data).eq('phone', phone).execute()
                return len(result.data) > 0
            except Exception as e:
                print(f"Error updating user status in Supabase: {e}")
                # Fallback to in-memory
                if phone in self.in_memory_users:
                    self.in_memory_users[phone].update(update_data)
                    return True
                return False
        else:
            # In-memory storage
            if phone in self.in_memory_users:
                self.in_memory_users[phone].update(update_data)
                return True
            return False

    async def update_user_verification(self, phone: str, verified: bool = True) -> bool:
        """Mark user as verified"""
        update_data = {
            'verified': verified,
            'last_login': datetime.now().isoformat()
        }
        
        if self.client:
            try:
                result = self.client.table('users').update(update_data).eq('phone', phone).execute()
                return len(result.data) > 0
            except Exception as e:
                print(f"Error updating user verification in Supabase: {e}")
                # Fallback to in-memory
                if phone in self.in_memory_users:
                    self.in_memory_users[phone].update(update_data)
                    return True
                return False
        else:
            # In-memory storage
            if phone in self.in_memory_users:
                self.in_memory_users[phone].update(update_data)
                return True
            return False

    async def set_otp_sent(self, phone: str, otp_sent_at: datetime) -> bool:
        """Record OTP sent time"""
        if self.client:
            try:
                # Check if user exists
                user = await self.get_user(phone)
                if not user:
                    # Create user if doesn't exist
                    await self.create_user(phone)
                
                update_data = {'otp_sent_at': otp_sent_at.isoformat()}
                result = self.client.table('users').update(update_data).eq('phone', phone).execute()
                return len(result.data) > 0
            except Exception as e:
                print(f"Error setting OTP sent time in Supabase: {e}")
                # Fallback to in-memory
                if phone not in self.in_memory_users:
                    await self.create_user(phone)
                self.in_memory_users[phone]['otp_sent_at'] = otp_sent_at.timestamp()
                return True
        else:
            # In-memory storage
            if phone not in self.in_memory_users:
                await self.create_user(phone)
            self.in_memory_users[phone]['otp_sent_at'] = otp_sent_at.timestamp()
            return True

    async def get_all_users(self) -> Dict[str, Any]:
        """Get all users (for debug)"""
        if self.client:
            try:
                result = self.client.table('users').select('*').execute()
                users_dict = {}
                for user in result.data:
                    users_dict[user['phone']] = user
                return users_dict
            except Exception as e:
                print(f"Error getting all users from Supabase: {e}")
                return self.in_memory_users
        else:
            return self.in_memory_users

    def is_connected(self) -> bool:
        """Check if connected to Supabase"""
        return self.client is not None

# Global database instance
db = SupabaseDB() 