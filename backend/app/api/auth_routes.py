# # app/api/auth_routes.py
# from fastapi import APIRouter, Depends, HTTPException, status
# from fastapi.security import OAuth2AuthorizationCodeBearer
# from sqlalchemy.orm import Session
# from app.api.dependencies import get_db
# from app.core.auth import create_access_token
# from app.models.user import User
# from datetime import timedelta
# from app.core.config import settings
# from typing import Dict
# import httpx

# router = APIRouter()

# @router.get("/auth/google/callback")
# async def google_callback(code: str, db: Session = Depends(get_db)):
#     """Handle Google OAuth callback"""
#     try:
#         # Exchange code for token
#         token_url = "https://oauth2.googleapis.com/token"
#         token_data = {
#             "client_id": settings.GOOGLE_CLIENT_ID,
#             "client_secret": settings.GOOGLE_CLIENT_SECRET,
#             "code": code,
#             "grant_type": "authorization_code",
#             "redirect_uri": settings.GOOGLE_REDIRECT_URI,
#         }
        
#         async with httpx.AsyncClient() as client:
#             token_response = await client.post(token_url, data=token_data)
#             token_response.raise_for_status()
#             token_info = token_response.json()
            
#             # Get user info from Google
#             user_info_response = await client.get(
#                 "https://www.googleapis.com/oauth2/v3/userinfo",
#                 headers={"Authorization": f"Bearer {token_info['access_token']}"}
#             )
#             user_info = user_info_response.json()
            
#         # Create or get user
#         oauth_data = {
#             "provider": "google",
#             "id": user_info["sub"],
#             "email": user_info["email"],
#             "profile": {
#                 "name": user_info.get("name"),
#                 "picture": user_info.get("picture"),
#                 "email_verified": user_info.get("email_verified", False)
#             }
#         }
        
#         user = User.get_or_create(db, oauth_data)
        
#         # Create access token using email as the subject
#         access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
#         access_token = create_access_token(
#             data={"sub": user.email},  # Using email instead of ID
#             expires_delta=access_token_expires
#         )
        
#         return {
#             "access_token": access_token,
#             "token_type": "bearer",
#             "user": {
#                 "email": user.email,
#                 "username": user.username,
#                 "is_active": user.is_active
#             }
#         }
        
#     except Exception as e:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail=f"Failed to process OAuth callback: {str(e)}"
#         )

# @router.get("/me", response_model=Dict)
# async def read_users_me(current_user: User = Depends(get_current_user)):
#     """Get current user info"""
#     return {
#         "email": current_user.email,
#         "username": current_user.username,
#         "oauth_provider": current_user.oauth_provider,
#         "profile_data": current_user.profile_data
#     }